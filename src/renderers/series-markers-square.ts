import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

enum Constants {
	BorderWidth = 0.1
}

export function drawSquare(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	borderColor?: string,
	borderWidth?: number
): void {
	const squareSize = shapeSize('square', size);
	const halfSize = squareSize / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;

	const fillStyle = ctx.fillStyle;

	if (borderColor && borderWidth) {
		ctx.fillStyle = borderColor;
	}

	ctx.fillRect(left, top, squareSize, squareSize);

	ctx.fillStyle = fillStyle;

	if (borderColor && borderWidth) {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const _borderWidth = Math.max(1, squareSize * (borderWidth ?? Constants.BorderWidth));
		ctx.fillRect(left + _borderWidth, top + _borderWidth, squareSize - 2 * _borderWidth, squareSize - 2 * _borderWidth);
	}
}

export function hitTestSquare(
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	x: Coordinate,
	y: Coordinate
): boolean {
	const squareSize = shapeSize('square', size);
	const halfSize = (squareSize - 1) / 2;
	const left = centerX - halfSize;
	const top = centerY - halfSize;

	return x >= left && x <= left + squareSize &&
		y >= top && y <= top + squareSize;
}
