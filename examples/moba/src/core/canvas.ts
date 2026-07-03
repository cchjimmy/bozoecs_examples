function initWindowStyles() {
  const styles = document.createElement("style");

  styles.innerHTML = `
		html,
		body {
			color: white;
			margin: 0px;
			padding: 0px;
			overflow: hidden;
			width: 100%;
			height: 100%;
			background-color: #181818;
			touch-action: none;
			user-select: none;
		}
		`;

  document.head.appendChild(styles);
}

function fitCanvasIn(elm: HTMLElement, canvas: HTMLCanvasElement) {
  elm.appendChild(canvas);

  elm.onresize = elm.onload = () => {
    if (elm.clientWidth / elm.clientHeight < canvas.width / canvas.height) {
      canvas.style.width = "100%";
      canvas.style.height = "";
    } else {
      canvas.style.width = "";
      canvas.style.height = "100%";
    }
  };

  canvas.style.position = "relative";
  canvas.style.top = "50%";
  canvas.style.left = "50%";
  canvas.style.transform = "translate(-50%, -50%)";
}

function initCanvas(): HTMLCanvasElement {
  return document.querySelector("canvas") ?? document.createElement("canvas");
}

export function setUpCanvas(canvasParent: HTMLElement = document.body): void {
  const canvas = initCanvas();
  initWindowStyles();
  fitCanvasIn(canvasParent, canvas);
}
