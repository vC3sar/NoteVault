<div align="center">

<img src="https://img.shields.io/badge/version-1.1.0--beta-e8ff47?style=for-the-badge&labelColor=111111" alt="Version"/>
<img src="https://img.shields.io/badge/platform-Windows-4a9eff?style=for-the-badge&logo=windows&logoColor=white&labelColor=111111" alt="Platform"/>
<img src="https://img.shields.io/badge/Electron-JS-47b4e8?style=for-the-badge&logo=electron&logoColor=white&labelColor=111111" alt="Electron"/>
<img src="https://img.shields.io/badge/license-MIT-3ecf8e?style=for-the-badge&labelColor=111111" alt="License"/>

<br/><br/>

```
███╗   ██╗ ██████╗ ████████╗███████╗██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██╔██╗ ██║██║   ██║   ██║   █████╗  ██║   ██║███████║██║   ██║██║     ██║   
██║╚██╗██║██║   ██║   ██║   ██╔══╝  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
██║ ╚████║╚██████╔╝   ██║   ███████╗ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
```

### 📔 University Manager · Pro Edition

**Tu bóveda personal de conocimiento académico.**  
Aplicación de escritorio moderna construida sobre Electron con estética OLED premium y glassmorphism.

<br/>

[🚀 Instalación rápida](#-instalación) · [✨ Características](#-características) · [⌨️ Shortcuts](#️-atajos-de-teclado) · [⚙️ Configuración](#️-configuración)

</div>

---

## ✨ Características

<table>
<tr>
<td width="50%" valign="top">

### 📁 Organización Inteligente
- **Libretas personalizadas** con colores o portadas de imagen
- **Buscador avanzado** desde el dashboard principal
- **Sección de Favoritos** para acceso rápido
- **Papelera con retención configurable** (30 días por defecto) y limpieza automática

</td>
<td width="50%" valign="top">

### ✍️ Editor de Texto Enriquecido
- **Formato completo**: negrita, cursiva, subrayado, colores y resaltados
- **Listas de tareas interactivas** con checkboxes funcionales
- **Control de zoom** para mayor comodidad visual
- **Contador de palabras en tiempo real**

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🖼️ Gestión Multimedia
- **Panel de adjuntos**: visualiza y busca imágenes y enlaces insertados
- **Redimensionado de imágenes**: 25% / 50% / 75% / 100% con control de alineación
- **Integración con reproductores** (Spotify y otros) desde la barra lateral

</td>
<td width="50%" valign="top">

### 🎨 Estética Premium
- **Modo OLED Dark** con negros profundos y acentos vibrantes
- **Efectos de transparencia** (`backdrop-blur`) para sensación de profundidad
- **Tipografía Inter** optimizada para pantallas de alta resolución

</td>
</tr>
</table>

---

## 🚀 Instalación

### Requisitos previos

| Herramienta | Versión recomendada | Enlace |
|---|---|---|
| Node.js | LTS | [nodejs.org](https://nodejs.org/) |
| npm | incluido con Node | — |

### Pasos

```bash
# 1 · Clonar el repositorio
git clone https://github.com/vC3sar/NoteVault.git
cd NoteVault

# 2 · Instalar dependencias
npm install

# 3 · Ejecutar en modo desarrollo
npm start

# 4 · Construir ejecutable para producción
npm run build
```

> **Tip:** Para desarrollo, `npm start` abre NoteVault con DevTools disponible via `F12`.

---

## ⌨️ Atajos de Teclado

### Editor

| Atajo | Acción |
|---|---|
| `Ctrl + B` | **Negrita** |
| `Ctrl + I` | *Cursiva* |
| `Ctrl + U` | Subrayado |

### Navegación

| Atajo | Acción |
|---|---|
| `Ctrl + L` | Ir a la Librería |
| `Ctrl + F` | Ir a Favoritos |
| `Ctrl + T` | Ir a la Papelera |

### Debug

| Atajo | Acción |
|---|---|
| `Ctrl + R` | Recargar aplicación |
| `F12` | Abrir DevTools |

---

## ⚙️ Configuración

Accede al panel de **Ajustes** desde la barra lateral para personalizar:

```
Ajustes
├── 🎨 Temas ............... Sistema / Claro / Oscuro / OLED
├── 🗑️ Retención papelera .. Días antes del borrado definitivo
├── 💾 Autoguardado ........ Intervalo en minutos
└── 🎵 Reproductor ......... Mostrar / ocultar en la sidebar
```

---

## 🛠️ Stack Tecnológico

```
NoteVault
├── Core
│   ├── JavaScript (ES6+)
│   ├── Node.js
│   └── Electron
├── Estilos
│   ├── Tailwind CSS (JIT mode)
│   └── CSS3 Custom Properties
├── UI
│   └── Lucide Icons
├── Almacenamiento
│   └── Sistema de archivos local (JSON + HTML)
└── Integraciones
    └── win-media-control (Windows Media Session API)
```

---

## 📁 Estructura del Proyecto

```
NoteVault/
├── main.js              ← Proceso principal de Electron
├── preload.js           ← Bridge renderer ↔ main
├── package.json
├── src/
│   ├── renderer/        ← UI (HTML + JS + CSS)
│   ├── components/      ← Componentes reutilizables
│   └── styles/          ← Tailwind + estilos globales
├── assets/
│   └── icons/
└── data/                ← Almacenamiento local (generado en runtime)
    ├── notebooks/
    └── settings.json
```

> **Nota:** La carpeta `data/` se genera automáticamente en el primer arranque.

---

## 📄 Licencia

```
MIT License · Copyright (c) 2025 vC3sar · vazquezsg.ovh
```

Consulta el archivo [`LICENSE`](LICENSE) para los términos completos.

---

<div align="center">

Hecho con ❤️ por **[vC3sar](https://vazquezsg.ovh)** · Vazquezsg.ovh

*NoteVault — Tu bóveda personal de conocimiento.*

</div>