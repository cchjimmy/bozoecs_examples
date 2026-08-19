(async function() {
	const adaptor = await navigator.gpu.requestAdapter();
	if (!adaptor) return;
	const device = await adaptor.requestDevice();
	if (!device) return;
	const canvas = document.querySelector("canvas");
	if (!canvas) return;
	const ctx = canvas.getContext("webgpu");
	if (!ctx) return;
	ctx.configure({
		device, format: navigator.gpu.getPreferredCanvasFormat()
	});
})();
