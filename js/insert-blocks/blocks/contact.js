import { escapeHTML } from "../../utils.js";
import { openBlockModal } from "../modal.js";
import { blockShell, insertRichBlock } from "../block-renderer.js";
import { registerBlockEditor } from "../block-editors.js";

export const contactBlock = {
  id: "contact-block",
  name: "Contacto",
  category: "blocks",
  description: "Tarjeta de contacto.",
  icon: "contact",
  async insert() {
    const data = await openBlockModal({
      title: "Insertar Contacto",
      icon: "contact",
      submitLabel: "Insertar contacto",
      fields: [
        { name: "name", label: "Nombre completo", placeholder: "Ej. Juan Pérez", required: true },
        { name: "role", label: "Puesto / Rol", placeholder: "Ej. Desarrollador Senior", required: true },
        { name: "email", label: "Correo electrónico", type: "email", placeholder: "Ej. juan@correo.com" },
        { name: "phone", label: "Teléfono", placeholder: "Ej. +52 55 1234 5678" },
        { name: "company", label: "Empresa", placeholder: "Ej. NoteVault Corp" },
        { name: "avatar", label: "URL del Avatar (Opcional)", placeholder: "Ej. https://ejemplo.com/avatar.jpg" },
        { name: "notes", label: "Notas / Información extra", type: "textarea", placeholder: "Ej. Horario de atención: 9am - 6pm" }
      ]
    });
    if (!data) return false;

    return insertRichBlock(blockShell({
      type: "contact",
      icon: "contact",
      title: "Contacto",
      meta: data.name.trim(),
      accent: "#3b82f6",
      editable: false,
      data: {
        contactName: data.name.trim(),
        contactRole: data.role.trim(),
        contactEmail: (data.email || "").trim(),
        contactPhone: (data.phone || "").trim(),
        contactCompany: (data.company || "").trim(),
        contactAvatar: (data.avatar || "").trim(),
        contactNotes: (data.notes || "").trim()
      },
      body: renderContactHtml(
        data.name.trim(),
        data.role.trim(),
        (data.email || "").trim(),
        (data.phone || "").trim(),
        (data.company || "").trim(),
        (data.avatar || "").trim(),
        (data.notes || "").trim()
      )
    }));
  }
};

function renderContactHtml(name, role, email, phone, company, avatar, notes) {
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `
    <div class="rich-contact-card" contenteditable="false">
      <div class="rich-contact-header">
        ${avatar ? `
          <img class="rich-contact-avatar" src="${escapeHTML(avatar)}" alt="${escapeHTML(name)}">
        ` : `
          <div class="rich-contact-avatar rich-contact-avatar-fallback">${escapeHTML(initials)}</div>
        `}
        <div class="rich-contact-main-info">
          <strong class="rich-contact-name">${escapeHTML(name)}</strong>
          <span class="rich-contact-role">${escapeHTML(role)}${company ? ` @ ${escapeHTML(company)}` : ""}</span>
        </div>
      </div>
      
      ${(email || phone || notes) ? `
        <div class="rich-contact-body-info">
          ${email ? `
            <a href="mailto:${escapeHTML(email)}" class="rich-contact-link">
              <i data-lucide="mail" class="w-4 h-4"></i> ${escapeHTML(email)}
            </a>
          ` : ""}
          ${phone ? `
            <a href="tel:${escapeHTML(phone)}" class="rich-contact-link">
              <i data-lucide="phone" class="w-4 h-4"></i> ${escapeHTML(phone)}
            </a>
          ` : ""}
          ${notes ? `
            <p class="rich-contact-notes">${escapeHTML(notes)}</p>
          ` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

registerBlockEditor("contact", async (block) => {
  if (!block) return false;
  const currentName = block.dataset.contactName || "";
  const currentRole = block.dataset.contactRole || "";
  const currentEmail = block.dataset.contactEmail || "";
  const currentPhone = block.dataset.contactPhone || "";
  const currentCompany = block.dataset.contactCompany || "";
  const currentAvatar = block.dataset.contactAvatar || "";
  const currentNotes = block.dataset.contactNotes || "";

  const data = await openBlockModal({
    title: "Editar Contacto",
    icon: "contact",
    submitLabel: "Guardar cambios",
    fields: [
      { name: "name", label: "Nombre completo", placeholder: "Ej. Juan Pérez", value: currentName, required: true },
      { name: "role", label: "Puesto / Rol", placeholder: "Ej. Desarrollador Senior", value: currentRole, required: true },
      { name: "email", label: "Correo electrónico", type: "email", placeholder: "Ej. juan@correo.com", value: currentEmail },
      { name: "phone", label: "Teléfono", placeholder: "Ej. +52 55 1234 5678", value: currentPhone },
      { name: "company", label: "Empresa", placeholder: "Ej. NoteVault Corp", value: currentCompany },
      { name: "avatar", label: "URL del Avatar (Opcional)", placeholder: "Ej. https://ejemplo.com/avatar.jpg", value: currentAvatar },
      { name: "notes", label: "Notas / Información extra", type: "textarea", placeholder: "Ej. Horario de atención...", value: currentNotes }
    ]
  });
  if (!data) return false;

  block.dataset.contactName = data.name.trim();
  block.dataset.contactRole = data.role.trim();
  block.dataset.contactEmail = (data.email || "").trim();
  block.dataset.contactPhone = (data.phone || "").trim();
  block.dataset.contactCompany = (data.company || "").trim();
  block.dataset.contactAvatar = (data.avatar || "").trim();
  block.dataset.contactNotes = (data.notes || "").trim();

  const metaEl = block.querySelector(".rich-block-heading small");
  if (metaEl) metaEl.textContent = data.name.trim();

  const bodyEl = block.querySelector(".rich-block-body");
  if (bodyEl) {
    bodyEl.innerHTML = renderContactHtml(
      data.name.trim(),
      data.role.trim(),
      (data.email || "").trim(),
      (data.phone || "").trim(),
      (data.company || "").trim(),
      (data.avatar || "").trim(),
      (data.notes || "").trim()
    );
  }
  return true;
});
