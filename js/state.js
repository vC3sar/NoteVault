export let state = {
    notebooks: [],
    trash: [],
    settings: { autosaveMinutes: 5, theme: 'system', trashRetentionDays: 30 },
    profile: { name: '', email: '', lang: 'es' },
    activeNotebookId: null,
    activeNoteId: null,
    currentView: 'all' // 'all', 'favorites', or 'trash'
};

export async function saveAll() {
    const result = await window.api.saveData({
        notebooks: state.notebooks,
        trash: state.trash,
        settings: state.settings,
        profile: state.profile
    });
    if (!result.success) console.error("Error al guardar:", result.error);
}
