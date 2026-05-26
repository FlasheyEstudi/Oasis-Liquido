'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { get, put, getErrorMessage } from '@/api/client';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Check, X, ExternalLink, Stethoscope, Building2 } from 'lucide-react';

export function PendingDocumentsPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { setNotification } = useAuthStore();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await get<any>('/documents/admin/pending');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'No se pudieron cargar los documentos pendientes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleVerifyGroup = async (
    docIds: string[],
    type: 'doctor' | 'clinic' | 'pharmacy',
    groupId: string,
    status: 'approved' | 'rejected'
  ) => {
    const reason = rejectionReasons[groupId];
    if (status === 'rejected' && !reason?.trim()) {
      setNotification({ type: 'warning', message: 'Por favor, especifica el motivo del rechazo' });
      return;
    }

    setProcessingId(groupId);
    try {
      // Loop through all documents of the group and verify them sequentially
      for (const docId of docIds) {
        await put(`/documents/admin/${type}/${docId}/verify`, {
          status,
          rejectionReason: status === 'rejected' ? reason : undefined
        });
      }

      setNotification({
        type: 'success',
        message: status === 'approved' 
          ? 'Establecimiento/médico aprobado y acreditado con éxito' 
          : 'Establecimiento/médico rechazado y notificado'
      });

      if (status === 'rejected') {
        const updated = { ...rejectionReasons };
        delete updated[groupId];
        setRejectionReasons(updated);
      }
      fetchDocuments();
    } catch (err) {
      setNotification({ type: 'error', message: getErrorMessage(err) || 'Error al procesar la verificación' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-10 animate-spin text-teal-500" />
        <p className="text-sm text-muted-foreground">Analizando expedientes de acreditación legal...</p>
      </div>
    );
  }

  const doctorDocs = data?.doctorDocuments || [];
  const clinicDocs = data?.clinicDocuments || [];
  const pharmacyDocs = data?.pharmacyDocuments || [];

  // Group Clinics
  const groupedClinics: Record<string, {
    clinic: any;
    uploader: any;
    documents: any[];
    createdAt: string;
  }> = {};

  clinicDocs.forEach((doc: any) => {
    const cid = doc.clinicId;
    if (!groupedClinics[cid]) {
      groupedClinics[cid] = {
        clinic: doc.clinic,
        uploader: doc.uploader,
        documents: [],
        createdAt: doc.createdAt,
      };
    }
    groupedClinics[cid].documents.push(doc);
    if (new Date(doc.createdAt) > new Date(groupedClinics[cid].createdAt)) {
      groupedClinics[cid].createdAt = doc.createdAt;
    }
  });

  // Group Pharmacies
  const groupedPharmacies: Record<string, {
    pharmacy: any;
    uploader: any;
    documents: any[];
    createdAt: string;
  }> = {};

  pharmacyDocs.forEach((doc: any) => {
    const pid = doc.pharmacyId;
    if (!groupedPharmacies[pid]) {
      groupedPharmacies[pid] = {
        pharmacy: doc.pharmacy,
        uploader: doc.uploader,
        documents: [],
        createdAt: doc.createdAt,
      };
    }
    groupedPharmacies[pid].documents.push(doc);
    if (new Date(doc.createdAt) > new Date(groupedPharmacies[pid].createdAt)) {
      groupedPharmacies[pid].createdAt = doc.createdAt;
    }
  });

  // Group Doctors
  const groupedDoctors: Record<string, {
    doctor: any;
    documents: any[];
    createdAt: string;
  }> = {};

  doctorDocs.forEach((doc: any) => {
    const did = doc.doctorId;
    if (!groupedDoctors[did]) {
      groupedDoctors[did] = {
        doctor: doc.doctor,
        documents: [],
        createdAt: doc.createdAt,
      };
    }
    groupedDoctors[did].documents.push(doc);
    if (new Date(doc.createdAt) > new Date(groupedDoctors[did].createdAt)) {
      groupedDoctors[did].createdAt = doc.createdAt;
    }
  });

  const totalGroups = Object.keys(groupedClinics).length + Object.keys(groupedPharmacies).length + Object.keys(groupedDoctors).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Cumplimiento Legal y Acreditaciones</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Auditoría sanitaria unificada de licencias MINSA y registros RUC</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {totalGroups} Pendientes
        </span>
      </div>

      {totalGroups === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Check className="size-8 text-emerald-500" />
          </div>
          <h3 className="font-bold text-foreground">¡Todo en regla!</h3>
          <p className="text-xs text-muted-foreground mt-1">No hay expedientes pendientes de validación sanitaria.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-6">
          {/* Clínicas */}
          {Object.keys(groupedClinics).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                <Building2 className="size-4 text-sky-500" />
                Clínicas Médicas
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(groupedClinics).map(([clinicId, group]: [string, any]) => (
                  <GlassCard key={clinicId} className="flex flex-col justify-between border-white/10 hover:border-white/20 transition-all p-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-500">
                          Expediente Completo ({group.documents.length} docs)
                        </span>
                        <span className="text-[10px] text-muted-foreground">Cargado el {new Date(group.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">{group.clinic?.name}</h4>
                      <p className="text-xs text-muted-foreground">{group.clinic?.address}</p>
                      <p className="text-xs text-slate-400 mt-2">Cargado por: <strong>{group.uploader?.name}</strong> ({group.uploader?.email})</p>

                      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Documentos Adjuntos:</span>
                        <div className="grid gap-2">
                          {group.documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors p-2.5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-teal-400" />
                                <span className="text-xs font-bold text-slate-300">
                                  {doc.type === 'ruc' ? 'RUC (Registro Único)' : doc.type === 'minsa_certificate' ? 'Certificación Sanitaria MINSA' : doc.type}
                                </span>
                              </div>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-black"
                              >
                                Ver PDF <ExternalLink className="size-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                      {processingId === clinicId ? (
                        <div className="flex justify-center py-2"><Loader2 className="size-5 animate-spin text-teal-500" /></div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Motivo de rechazo (obligatorio para rechazar)"
                            value={rejectionReasons[clinicId] || ''}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [clinicId]: e.target.value })}
                            className="glass-input h-9 text-xs rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                              onClick={() => handleVerifyGroup(group.documents.map((d: any) => d.id), 'clinic', clinicId, 'approved')}
                            >
                              <Check className="size-3.5" /> Aprobar Clínica
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 rounded-xl hover:bg-red-500/10 text-red-500 text-xs font-bold gap-1"
                              onClick={() => handleVerifyGroup(group.documents.map((d: any) => d.id), 'clinic', clinicId, 'rejected')}
                            >
                              <X className="size-3.5" /> Rechazar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Farmacias */}
          {Object.keys(groupedPharmacies).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                <Building2 className="size-4 text-orange-500" />
                Farmacias Autorizadas
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(groupedPharmacies).map(([pharmacyId, group]: [string, any]) => (
                  <GlassCard key={pharmacyId} className="flex flex-col justify-between border-white/10 hover:border-white/20 transition-all p-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500">
                          Expediente Completo ({group.documents.length} docs)
                        </span>
                        <span className="text-[10px] text-muted-foreground">Cargado el {new Date(group.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">{group.pharmacy?.name}</h4>
                      <p className="text-xs text-muted-foreground">{group.pharmacy?.address}</p>
                      <p className="text-xs text-slate-400 mt-2">Cargado por: <strong>{group.uploader?.name}</strong> ({group.uploader?.email})</p>

                      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Documentos Adjuntos:</span>
                        <div className="grid gap-2">
                          {group.documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors p-2.5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-teal-400" />
                                <span className="text-xs font-bold text-slate-300">
                                  {doc.type === 'ruc' ? 'RUC (Registro Único)' : doc.type === 'minsa_certificate' ? 'Certificación Sanitaria MINSA' : doc.type}
                                </span>
                              </div>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-black"
                              >
                                Ver PDF <ExternalLink className="size-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                      {processingId === pharmacyId ? (
                        <div className="flex justify-center py-2"><Loader2 className="size-5 animate-spin text-teal-500" /></div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Motivo de rechazo (obligatorio para rechazar)"
                            value={rejectionReasons[pharmacyId] || ''}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [pharmacyId]: e.target.value })}
                            className="glass-input h-9 text-xs rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                              onClick={() => handleVerifyGroup(group.documents.map((d: any) => d.id), 'pharmacy', pharmacyId, 'approved')}
                            >
                              <Check className="size-3.5" /> Aprobar Farmacia
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 rounded-xl hover:bg-red-500/10 text-red-500 text-xs font-bold gap-1"
                              onClick={() => handleVerifyGroup(group.documents.map((d: any) => d.id), 'pharmacy', pharmacyId, 'rejected')}
                            >
                              <X className="size-3.5" /> Rechazar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Doctores */}
          {Object.keys(groupedDoctors).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                <Stethoscope className="size-4 text-purple-500" />
                Médicos
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(groupedDoctors).map(([doctorId, group]: [string, any]) => (
                  <GlassCard key={doctorId} className="flex flex-col justify-between border-white/10 hover:border-white/20 transition-all p-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-500">
                          Expediente Completo ({group.documents.length} docs)
                        </span>
                        <span className="text-[10px] text-muted-foreground">Cargado el {new Date(group.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">Dr(a). {group.doctor?.name}</h4>
                      <p className="text-xs text-muted-foreground">{group.doctor?.email}</p>
                      <p className="text-xs text-slate-400 mt-2">Especialidad: <strong>{group.doctor?.doctorProfile?.specialty || 'General'}</strong></p>

                      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Documentos Adjuntos:</span>
                        <div className="grid gap-2">
                          {group.documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors p-2.5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-teal-400" />
                                <span className="text-xs font-bold text-slate-300">
                                  {doc.type === 'license' ? 'Cédula de Especialidad/MINSA' : doc.type === 'degree' ? 'Título Profesional' : doc.type}
                                </span>
                              </div>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-black"
                              >
                                Ver PDF <ExternalLink className="size-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                      {processingId === doctorId ? (
                        <div className="flex justify-center py-2"><Loader2 className="size-5 animate-spin text-teal-500" /></div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Motivo de rechazo (obligatorio para rechazar)"
                            value={rejectionReasons[doctorId] || ''}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [doctorId]: e.target.value })}
                            className="glass-input h-9 text-xs rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                              onClick={() => handleVerifyGroup(group.documents.map((d: any) => d.id), 'doctor', doctorId, 'approved')}
                            >
                              <Check className="size-3.5" /> Aprobar Médico
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 rounded-xl hover:bg-red-500/10 text-red-500 text-xs font-bold gap-1"
                              onClick={() => handleVerifyGroup(group.documents.map((d: any) => d.id), 'doctor', doctorId, 'rejected')}
                            >
                              <X className="size-3.5" /> Rechazar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
