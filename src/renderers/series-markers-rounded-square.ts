import { Coordinate } from '../model/coordinate';

import { shapeSize } from './series-markers-utils';

const enum Constants {
	CornerRadius = 0.25,
	BorderWidth = 0.1
}

export function drawRoundedSquare(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	borderColor?: string,
	borderWidth?: number
): void {
	const squareSize = shapeSize('roundedSquare', size);
	const halfSize = squareSize / 2;
	let left = centerX - halfSize;
	let right = centerX + halfSize;
	let top = centerY - halfSize;
	let bottom = centerY + halfSize;
	let radius = squareSize * Constants.CornerRadius;

	const fillStyle = ctx.fillStyle;

	if (borderColor && borderWidth) {
		ctx.fillStyle = borderColor;
	}

	_drawRoundedSquare(ctx, left, right, top, bottom, radius);

	ctx.fillStyle = fillStyle;

	if (borderColor && borderWidth) {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const _borderWidth = Math.max(1, squareSize * (borderWidth ?? Constants.BorderWidth));
		left += _borderWidth;
		right -= _borderWidth;
		top += _borderWidth;
		bottom -= _borderWidth;
		radius -= _borderWidth;

		_drawRoundedSquare(ctx, left, right, top, bottom, radius);
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _drawRoundedSquare(
	ctx: CanvasRenderingContext2D,
	left: number,
	right: number,
	top: number,
	bottom: number,
	radius: number
): void {
	ctx.beginPath();
	ctx.moveTo(left + radius, top);
	ctx.lineTo(right - radius, top);
	ctx.quadraticCurveTo(right, top, right, top + radius);
	ctx.lineTo(right, bottom - radius);
	ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
	ctx.lineTo(left + radius, bottom);
	ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
	ctx.lineTo(left, top + radius);
	ctx.quadraticCurveTo(left, top, left + radius, top);
	ctx.closePath();
	ctx.fill();
}

export function hitTestRoundedSquare(
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
