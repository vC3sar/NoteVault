# 📔 NoteVault - University Manager
> Pro Edition | Versión 1.1.0-beta

![NoteVault Hero Mockup](C:\Users\vCesar\.gemini\antigravity\brain\eb6d07f3-c281-488a-9645-62a058148616\notevault_hero_mockup_1777654982544.png)

**NoteVault** es una aplicación de escritorio moderna y minimalista diseñada para la gestión eficiente de notas y apuntes académicos. Construida con una arquitectura modular sobre **Electron**, ofrece una experiencia fluida con un diseño premium inspirado en interfaces OLED y principios de glassmorphism.

---

## ✨ Características Principales

### 📁 Organización Inteligente
- **Libretas Personalizadas**: Organiza tus notas en libretas con colores personalizados o portadas de imagen.
- **Buscador Avanzado**: Localiza rápidamente cualquier libreta desde el dashboard principal.
- **Sección de Favoritos**: Acceso rápido a tus libretas más importantes.
- **Gestión de Papelera**: Sistema de retención de notas eliminadas por 30 días (configurable) con limpieza automática.

### ✍️ Editor de Texto Enriquecido
- **Formato Completo**: Negrita, cursiva, subrayado, colores de texto y resaltados.
- **Listas de Tareas Interactivas**: Crea checkboxes que puedes marcar y desmarcar directamente en el editor.
- **Control de Zoom**: Ajusta el tamaño de la interfaz de escritura para mayor comodidad visual.
- **Contador de Palabras en Tiempo Real**: Ideal para llevar el control de tus ensayos y tareas.

### 🖼️ Gestión de Multimedia
- **Panel de Adjuntos**: Visualiza y busca todas las imágenes y enlaces insertados en tus notas.
- **Redimensionado de Imágenes**: Ajusta el tamaño de tus imágenes (25%, 50%, 75%, 100%) y su alineación.
- **Integración Multimedia**: Controla tu música (Spotify, etc.) directamente desde la barra lateral de NoteVault.

### 🎨 Estética Premium
- **Modo OLED Dark**: Interfaz optimizada para pantallas modernas con negros profundos y acentos vibrantes.
- **Efectos de Transparencia**: Uso extensivo de `backdrop-blur` para una sensación de profundidad y elegancia.
- **Tipografía Moderna**: Basado en la fuente **Inter** para una legibilidad superior.

---

## ⌨️ Atajos de Teclado (Shortcuts)

| Comando | Acción |
| :--- | :--- |
| `Ctrl + L` | Ir a la Librería |
| `Ctrl + T` | Ir a la Papelera |
| `Ctrl + F` | Ir a Favoritos |
| `Ctrl + B` | Negrita (Bold) |
| `Ctrl + I` | Cursiva (Italic) |
| `Ctrl + U` | Subrayado (Underline) |
| `Ctrl + R` | Recargar Aplicación (Solo Debug) |
| `F12` | Abrir DevTools (Solo Debug) |

---

## ⚙️ Configuración y Opciones

NoteVault permite una personalización profunda desde el panel de **Ajustes**:

- **Temas**: Cambia entre Tema del Sistema, Claro, Oscuro o el exclusivo modo OLED.
- **Retención de Papelera**: Define cuántos días deben permanecer las notas antes de su borrado definitivo.
- **Autoguardado**: Configura el intervalo de guardado automático (en minutos) para no perder nunca tu progreso.
- **Reproductor Multimedia**: Activa o desactiva la visibilidad del controlador de música en la sidebar.

---

## 🚀 Instrucciones de Instalación

### Requisitos Previos
- [Node.js](https://nodejs.org/) (versión LTS recomendada)
- npm (incluido con Node.js)

### Pasos
1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/vC3sar/NoteVault.git
   ```
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Ejecutar en modo desarrollo**:
   ```bash
   npm start
   ```
4. **Construir ejecutable para producción**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologías Utilizadas

- **Core**: JavaScript (ES6+), Node.js, Electron.
- **Estilos**: Tailwind CSS (JIT mode), CSS3 Custom Properties.
- **Iconografía**: Lucide Icons.
- **Almacenamiento**: Sistema de archivos local (JSON + HTML).
- **Librerías Extra**: `win-media-control` para integración nativa con Windows.

---

## 👤 Créditos del Autor

Proyecto desarrollado con ❤️ por **vC3sar**.

- **Sitio Web**: [vazquezsg.ovh](https://vazquezsg.ovh)
- **Organización**: Vazquezsg.ovh
- **Propósito**: Herramienta de gestión académica y personal.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---
*NoteVault - Tu bóveda personal de conocimiento.*
