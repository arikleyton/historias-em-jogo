// HUD de madeira: icone + contador, reaproveitado em todas as cenas.
// Le o valor global em scene.registry ("woodCount") e se atualiza sozinho
// sempre que esse valor mudar, via o evento "changedata" do registry.

function addWoodHud(scene) {
  const text = createPanelText(scene, 58, 56, `x${scene.registry.get("woodCount") || 0}`, {
    fontSize: "20px",
    bold: true,
    originX: 0,
    originY: 0.5,
    depth: 998,
    scrollFactor: 0,
  });

  const icon = scene.add
    .image(30, 56, "madeira_icone")
    .setDisplaySize(36, 36)
    .setScrollFactor(0)
    .setDepth(1000);

  const onRegistryChange = (parent, key, value) => {
    if (key === "woodCount") text.setText(`x${value}`);
  };

  scene.registry.events.on("changedata", onRegistryChange);
  // Sem isso o listener sobreviveria a troca de cena e acumularia handlers duplicados.
  scene.events.once("shutdown", () => scene.registry.events.off("changedata", onRegistryChange));

  return { icon, text };
}
