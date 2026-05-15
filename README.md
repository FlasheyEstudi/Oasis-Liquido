# 🏝️ OASIS LIQUIDA
> **"Tus medicinas en tus manos, tu salud en tu oasis."**

Oasis Liquida es una plataforma de salud integral de última generación diseñada para transformar la experiencia médica en Nicaragua. Al fusionar una red farmacéutica inteligente con una infraestructura clínica digital, Oasis Liquida coloca el bienestar directamente en las manos de los pacientes, ofreciendo inmediatez, transparencia y tecnología de punta.

![Oasis Aura Design](https://img.shields.io/badge/Design-Holographic_Aura-teal?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_%7C_Prisma_%7C_SQLite-blue?style=for-the-badge)
![Location](https://img.shields.io/badge/Region-Nicaragua-orange?style=for-the-badge)

---

## ✨ La Experiencia Oasis

Nuestra plataforma no es solo una aplicación; es un ecosistema de bienestar diseñado bajo la estética **Aura** — una interfaz cinematográfica, holográfica y fluida que hace que gestionar la salud sea una experiencia premium y sin fricciones.

### 🏥 Red Clínica Digital
- **Agendamiento Inteligente**: Encuentra especialistas por nombre o especialidad en los mejores hospitales de Nicaragua (Vivian Pellas, Hospital Militar, Bautista).
- **Telemedicina de Próxima Generación**: Consultas virtuales con integración de historial clínico en tiempo real.
- **Expediente Único**: Tu historia médica, alergias y notas de consulta siempre disponibles y protegidas.

### 💊 Farmacia en Tus Manos
- **Mapa Aura**: Localiza farmacias cercanas (Saba, Kielsa, Medco) con visualización de inventario en tiempo real.
- **Receta Digital QR**: Olvídate de los papeles. Tus recetas se generan con códigos QR dinámicos para un surtido seguro y rápido.
- **E-Commerce Farmacéutico**: Compra tus medicamentos desde el sofá y recíbelos en minutos.

### 🚚 Logística "Oasis Express"
- **Seguimiento en Tiempo Real**: Visualiza a tu repartidor en el mapa mientras lleva tu oasis de salud a tu puerta.
- **Entregas Garantizadas**: Sistema de trazabilidad total desde el escaneo en farmacia hasta la firma del paciente.

---

## 🛠️ Arquitectura Técnica

Oasis Liquida está construida sobre una base sólida de grado industrial:

- **Frontend**: [Next.js 15](https://nextjs.org/) con [Tailwind CSS v4](https://tailwindcss.com/) para una UI de alto impacto.
- **Estado**: [Zustand](https://github.com/pmndrs/zustand) para una gestión de datos reactiva y ultra-rápida.
- **Backend**: Node.js con [Prisma ORM](https://www.prisma.io/) para una integridad de datos absoluta.
- **Base de Datos**: SQLite (Desarrollo/Edge) con soporte para migraciones complejas.
- **Geolocalización**: Integración con [MapLibre GL](https://maplibre.org/) y OpenFreeMap para una cartografía precisa de Nicaragua.

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/oasis-liquida.git
   cd oasis-liquida
   ```

2. **Configurar el Backend**:
   ```bash
   cd Backend
   npm install
   npx prisma migrate dev
   npm run seed  # Genera el ecosistema completo de Nicaragua
   npm run dev
   ```

3. **Configurar el Frontend**:
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```

4. **Acceso**:
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 👥 Roles del Sistema

| Rol | Función Principal |
| :--- | :--- |
| **Paciente** | Reserva de citas, compras en farmacia y seguimiento de pedidos. |
| **Médico** | Gestión de consultas y emisión de recetas digitales QR. |
| **Farmacéutico** | Control de inventario (Kardex), POS y surtido de recetas. |
| **Repartidor** | Logística de entregas con geolocalización activa. |
| **Administrador** | Auditoría global, gestión de clínicas y control de usuarios. |

---

## 🛡️ Seguridad y Privacidad

- **Encriptación AES-256**: Todos los datos sensibles del paciente están cifrados en reposo.
- **JWT Authentication**: Sesiones seguras con tokens de acceso y refresco de corta duración.
- **Auditoría Total**: Cada acción crítica es registrada en nuestro sistema de logs inmutable.

---

<p align="center">
  Hecho con ❤️ para la salud de Nicaragua.<br>
  <b>Oasis Liquida — Tu bienestar, nuestra misión.</b>
</p>
