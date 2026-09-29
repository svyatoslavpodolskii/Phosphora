export async function activate(app) {
  await app.commands.add({
    id: 'create-idea',
    name: 'Записать новую идею',
    async run() {
      const atom = await app.atoms.create({title: 'Новая идея', type: 'idea', appearance: {color: '#d4a2e5', icon: '✦'}});
      await app.graph.focus(atom.id);
      await app.ui.notify('Идея появилась на карте. Откройте её и запишите мысль.');
    }
  });
}
