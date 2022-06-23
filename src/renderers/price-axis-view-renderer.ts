/* eslint-disable complexity */
import { drawScaled } from '../helpers/canvas-helpers';

import { TextWidthCache } from '../model/text-width-cache';

import {
	IPriceAxisViewRenderer,
	PriceAxisViewRendererCommonData,
	PriceAxisViewRendererData,
	PriceAxisViewRendererOptions,
} from './iprice-axis-view-renderer';

export class PriceAxisViewRenderer implements IPriceAxisViewRenderer {
	private _data!: PriceAxisViewRendererData;
	private _commonData!: PriceAxisViewRendererCommonData;

	public constructor(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData) {
		this.setData(data, commonData);
	}

	public setData(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void {
		this._data = data;
		this._commonData = commonData;
	}

	public draw(
		ctx: CanvasRenderingContext2D,
		rendererOptions: PriceAxisViewRendererOptions,
		textWidthCache: TextWidthCache,
		width: number,
		align: 'left' | 'right',
		pixelRatio: number
	): void {
		if (!this._data.visible) {
			return;
		}

		ctx.font = rendererOptions.font;

		const tickSize = (this._data.tickVisible || !this._data.moveTextToInvisibleTick) ? rendererOptions.tickLength : 0;
		const horzBorder = rendererOptions.borderSize;
		const paddingTop = rendererOptions.paddingTop;
		const paddingBottom = rendererOptions.paddingBottom;
		const paddingInner = rendererOptions.paddingInner;
		const paddingOuter = rendererOptions.paddingOuter;
		const text = this._data.text;
		const textWidth = Math.ceil(textWidthCache.measureText(ctx, text));
		const baselineOffset = rendererOptions.baselineOffset;
		const totalHeight = rendererOptions.fontSize + paddingTop + paddingBottom;
		const halfHeigth = Math.ceil(totalHeight * 0.5);
		const totalWidth = horzBorder + textWidth + paddingInner + paddingOuter + tickSize;
		const cornerRadius = Math.min(halfHeigth, this._data.cornerRadius ?? 0);

		let yMid = this._commonData.coordinate;
		if (this._commonData.fixedCoordinate) {
			yMid = this._commonData.fixedCoordinate;
		}

		yMid = Math.round(yMid);

		const yTop = yMid - halfHeigth;
		const yBottom = yTop + totalHeight;

		const alignRight = align === 'right';

		const xInside = alignRight ? width : 0;
		const rightScaled = Math.ceil(width * pixelRatio);

		let xOutside = xInside;
		let xTick: number;
		let xText: number;

		ctx.fillStyle = this._commonData.background;
		ctx.lineWidth = 1;
		ctx.lineCap = 'butt';

		if (text) {
			if (alignRight) {
				// 2               1
				//
				//              6  5
				//
				// 3               4
				xOutside = xInside - totalWidth;
				xTick = xInside - tickSize;
				xText = xOutside + paddingOuter;
			} else {
				// 1               2
				//
				// 6  5
				//
				// 4               3
				xOutside = xInside + totalWidth;
				xTick = xInside + tickSize;
				xText = xInside + horzBorder + tickSize + paddingInner;
			}

			const tickHeight = Math.max(1, Math.floor(pixelRatio));

			const horzBorderScaled = Math.max(1, Math.floor(horzBorder * pixelRatio));
			const xInsideScaled = alignRight ? rightScaled : 0;
			const yTopScaled = Math.round(yTop * pixelRatio);
			const xOutsideScaled = Math.round(xOutside * pixelRatio);
			const yMidScaled = Math.round(yMid * pixelRatio) - Math.floor(pixelRatio * 0.5);

			const yBottomScaled = yMidScaled + tickHeight + (yMidScaled - yTopScaled);
			const xTickScaled = Math.round(xTick * pixelRatio);

			const cornerRadiusScaled = Math.round(cornerRadius * pixelRatio);

			ctx.save();

			if (cornerRadius) {
				if (alignRight) {
					this._drawRoundedRect(ctx, xOutsideScaled, xInsideScaled, yTopScaled, yBottomScaled, cornerRadiusScaled);
				} else {
					this._drawRoundedRect(ctx, xInsideScaled, xOutsideScaled, yTopScaled, yBottomScaled, cornerRadiusScaled);
				}
				ctx.fill();
			} else {
				ctx.beginPath();
				ctx.moveTo(xInsideScaled, yTopScaled);
				ctx.lineTo(xOutsideScaled, yTopScaled);
				ctx.lineTo(xOutsideScaled, yBottomScaled);
				ctx.lineTo(xInsideScaled, yBottomScaled);
				ctx.fill();
				// draw border
				ctx.fillStyle = this._data.borderColor;
				ctx.fillRect(alignRight ? rightScaled - horzBorderScaled : 0, yTopScaled, horzBorderScaled, yBottomScaled - yTopScaled);
			}

			if (this._data.tickVisible) {
				ctx.fillStyle = this._commonData.color;
				ctx.fillRect(xInsideScaled, yMidScaled, xTickScaled - xInsideScaled, tickHeight);
			}

			ctx.textAlign = 'left';
			ctx.fillStyle = this._commonData.color;

			drawScaled(ctx, pixelRatio, () => {
				ctx.fillText(text, xText, yBottom - paddingBottom - baselineOffset);
			});

			ctx.restore();
		}
	}

	public height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number {
		if (!this._data.visible) {
			return 0;
		}

		return rendererOptions.fontSize + rendererOptions.paddingTop + rendererOptions.paddingBottom;
	}

	private _drawRoundedRect(ctx: CanvasRenderingContext2D, left: number, right: number, top: number, bottom: number, radius: number): void {
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
	}
}
