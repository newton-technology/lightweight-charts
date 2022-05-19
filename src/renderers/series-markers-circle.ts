import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

const enum Constants {
	BorderWidth = 0.1
}

export function drawCircle(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	borderColor?: string,
	borderWidth?: number
): void {
	const circleSize = shapeSize('circle', size);
	const halfSize = (circleSize - 1) / 2;

	const fillStyle = ctx.fillStyle;

	if (borderColor && borderWidth) {
		ctx.fillStyle = borderColor;
	}

	ctx.beginPath();
	ctx.arc(centerX, centerY, halfSize, 0, 2 * Math.PI, false);
	ctx.fill();

	ctx.fillStyle = fillStyle;

	if (borderColor && borderWidth) {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const _borderWidth = Math.max(1, circleSize * (borderWidth ?? Constants.BorderWidth));
		ctx.beginPath();
		ctx.arc(centerX, centerY, halfSize - _borderWidth, 0, 2 * Math.PI, false);
		ctx.fill();
	}
}

export function hitTestCircle(
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const circleSize = shapeSize('circle', size);
	const tolerance = 2 + circleSize / 2;

	const xOffset = centerX - x;
	const yOffset = centerY - y;

	const dist = Math.sqrt(xOffset * xOffset + yOffset * yOffset);

	return dist <= tolerance;
}
