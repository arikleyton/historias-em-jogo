// Painel de texto com fundo arredondado em tom de madeira/dourado, reaproveitado
// em HUD, prompts e contadores - visual consistente com o botao "Voltar ao Mapa",
// no lugar da caixa preta padrao usada antes. O texto retornado se comporta como
// um Text normal: setText/setPosition/setVisible continuam funcionando, so que
// redesenham o painel atras automaticamente.

const UI_PANEL_FILL = 0x3d2b1f;
const UI_PANEL_FILL_ALPHA = 0.88;
const UI_PANEL_BORDER = 0xb98a4a;
const UI_PANEL_RADIUS = 8;
const UI_PANEL_TEXT_COLOR = "#f3e6d3";
const UI_PANEL_PADDING_X = 10;
const UI_PANEL_PADDING_Y = 6;

function createPanelText(scene, x, y, initialText, options = {}) {
  const depth = options.depth ?? 999;
  const originX = options.originX ?? 0;
  const originY = options.originY ?? 0;
  const paddingX = options.paddingX ?? UI_PANEL_PADDING_X;
  const paddingY = options.paddingY ?? UI_PANEL_PADDING_Y;
  const radius = options.radius ?? UI_PANEL_RADIUS;
  const fillColor = options.fillColor ?? UI_PANEL_FILL;
  const fillAlpha = options.fillAlpha ?? UI_PANEL_FILL_ALPHA;
  const borderColor = options.borderColor ?? UI_PANEL_BORDER;

  const background = scene.add
    .graphics()
    .setDepth(depth)
    .setScrollFactor(options.scrollFactor ?? 1);

  const text = scene.add
    .text(x, y, initialText, {
      fontSize: options.fontSize || "18px",
      color: options.color || UI_PANEL_TEXT_COLOR,
      fontFamily: "monospace",
      fontStyle: options.bold ? "bold" : "normal",
      align: options.align || "left",
      wordWrap: options.wordWrapWidth ? { width: options.wordWrapWidth } : undefined,
    })
    .setOrigin(originX, originY)
    .setDepth(depth + 1)
    .setScrollFactor(options.scrollFactor ?? 1);

  const redrawPanel = () => {
    if (!text.visible) return;

    const b = text.getBounds();
    background.clear();
    background.fillStyle(fillColor, fillAlpha);
    background.fillRoundedRect(b.x - paddingX, b.y - paddingY, b.width + paddingX * 2, b.height + paddingY * 2, radius);
    background.lineStyle(2, borderColor, 1);
    background.strokeRoundedRect(b.x - paddingX, b.y - paddingY, b.width + paddingX * 2, b.height + paddingY * 2, radius);
  };

  ["setText", "setPosition", "setOrigin"].forEach((methodName) => {
    const original = text[methodName].bind(text);
    text[methodName] = (...args) => {
      const result = original(...args);
      redrawPanel();
      return result;
    };
  });

  const originalSetVisible = text.setVisible.bind(text);
  text.setVisible = (visible) => {
    originalSetVisible(visible);
    background.setVisible(visible);
    if (visible) redrawPanel();
    return text;
  };

  text.setVisible(options.visible !== false);
  redrawPanel();

  return text;
}
