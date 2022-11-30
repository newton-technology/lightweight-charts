/* eslint-disable complexity */
import { ensureNever } from '../../helpers/assertions';
import { isNumber } from '../../helpers/strict-type-checks';

import { AutoScaleMargins } from '../../model/autoscale-info-impl';
import { BarPrice, BarPrices } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { InternalSeriesMarker, SeriesMarker } from '../../model/series-markers';
import { TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import {
	SeriesMarkerRendererData,
	SeriesMarkerRendererDataItem,
	SeriesMarkersRenderer,
} from '../../renderers/series-markers-renderer';
import {
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
	shapeSize as calculateShapeSize,
} from '../../renderers/series-markers-utils';

import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';

const enum Constants {
	TextMargin = 0.1,
	AxisMargin = 2,
}

interface Offsets {
	aboveBar: number;
	belowBar: number;
	top: number;
	bottom: number;
}

// eslint-disable-next-line max-params
function fillSizeAndY(
	rendererItem: SeriesMarkerRendererDataItem,
	marker: SeriesMarker<TimePointIndex>,
	seriesData: BarPrices | BarPrice,
	offsets: Offsets,
	textHeight: number,
	shapeMargin: number,
	priceScale: PriceScale,
	timeScale: TimeScale,
	firstValue: number
): void {
	const inBarPrice = isNumber(seriesData) ? seriesData : seriesData.close;
	const highPrice = isNumber(seriesData) ? seriesData : seriesData.high;
	const lowPrice = isNumber(seriesData) ? seriesData : seriesData.low;
	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const shapeSize = calculateShapeHeight(timeScale.barSpacing()) * sizeMultiplier;
	const markerSize = calculateShapeSize(marker.shape, shapeSize);
	const halfSize = shapeSize / 2;
	const textPosition = marker.textPosition ?? 'auto';
	rendererItem.size = shapeSize;

	switch (marker.position) {
		case 'inBar': {
			rendererItem.y = priceScale.priceToCoordinate(inBarPrice, firstValue);
			if (rendererItem.text !== undefined) {
				switch (textPosition) {
					case 'insideMarker':
						rendererItem.text.y = rendererItem.y;
						break;
					default:
						rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin) as Coordinate;
				}
			}
			return;
		}
		case 'aboveBar': {
			rendererItem.y = (priceScale.priceToCoordinate(highPrice, firstValue) - halfSize - offsets.aboveBar) as Coordinate;
			if (rendererItem.text !== undefined) {
				switch (textPosition) {
					case 'insideMarker':
						rendererItem.text.y = rendererItem.y;
						break;
					default:
						rendererItem.text.y = rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin) as Coordinate;
						offsets.aboveBar += textHeight * (1 + 2 * Constants.TextMargin);
				}
			}
			offsets.aboveBar += shapeSize + shapeMargin;
			return;
		}
		case 'belowBar': {
			rendererItem.y = (priceScale.priceToCoordinate(lowPrice, firstValue) + halfSize + offsets.belowBar) as Coordinate;
			if (rendererItem.text !== undefined) {
				switch (textPosition) {
					case 'insideMarker':
						rendererItem.text.y = rendererItem.y;
						break;
					default:
						rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin) as Coordinate;
						offsets.belowBar += textHeight * (1 + 2 * Constants.TextMargin);
				}
			}
			offsets.belowBar += shapeSize + shapeMargin;
			return;
		}
		case 'top': {
			rendererItem.y = markerSize / 2 + offsets.top as Coordinate;
			if (rendererItem.text !== undefined) {
				switch (textPosition) {
					case 'insideMarker':
						rendererItem.text.y = rendererItem.y;
						break;
					default:
						rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin) as Coordinate;
				}
			}
			return;
		}
		case 'bottom': {
			rendererItem.y = priceScale.height() - markerSize / 2 - offsets.bottom as Coordinate;
			if (rendererItem.text !== undefined) {
				switch (textPosition) {
					case 'insideMarker':
						rendererItem.text.y = rendererItem.y;
						break;
					default:
						rendererItem.text.y = rendererItem.y - halfSize - shapeMargin - textHeight * (0.5 + Constants.TextMargin) as Coordinate;
				}
			}
			return;
		}
	}

	ensureNever(marker.position);
}

export class SeriesMarkersPaneView implements IUpdatablePaneView {
	private readonly _series: Series;
	private readonly _model: ChartModel;
	private _data: SeriesMarkerRendererData;

	private _invalidated: boolean = true;
	private _dataInvalidated: boolean = true;
	private _autoScaleMarginsInvalidated: boolean = true;

	private _autoScaleMargins: AutoScaleMargins | null = null;

	private _renderer: SeriesMarkersRenderer = new SeriesMarkersRenderer();

	public constructor(series: Series, model: ChartModel) {
		this._series = series;
		this._model = model;
		this._data = {
			items: [],
			visibleRange: null,
		};
	}

	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		this._autoScaleMarginsInvalidated = true;
		if (updateType === 'data') {
			this._dataInvalidated = true;
		}
	}

	public renderer(height: number, width: number, addAnchors?: boolean): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		if (this._invalidated) {
			this._makeValid();
		}

		const layout = this._model.options().layout;
		this._renderer.setParams(layout.fontSize, layout.fontFamily);
		this._renderer.setData(this._data);

		return this._renderer;
	}

	public autoScaleMargins(): AutoScaleMargins | null {
		if (this._autoScaleMarginsInvalidated) {
			if (this._series.indexedMarkers().length > 0) {
				const barSpacing = this._model.timeScale().barSpacing();
				const shapeMargin = calculateShapeMargin(barSpacing);
				const marginsAboveAndBelow = calculateShapeHeight(barSpacing) * 1.5 + shapeMargin * 2;
				this._autoScaleMargins = {
					above: marginsAboveAndBelow as Coordinate,
					below: marginsAboveAndBelow as Coordinate,
				};
			} else {
				this._autoScaleMargins = null;
			}

			this._autoScaleMarginsInvalidated = false;
		}

		return this._autoScaleMargins;
	}

	protected _makeValid(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesMarkers = this._series.indexedMarkers();
		if (this._dataInvalidated) {
			this._data.items = seriesMarkers.map<SeriesMarkerRendererDataItem>((marker: InternalSeriesMarker<TimePointIndex>) => ({
				time: marker.time,
				x: 0 as Coordinate,
				y: 0 as Coordinate,
				size: 0,
				shape: marker.shape,
				color: marker.color,
				internalId: marker.internalId,
				externalId: marker.id,
				text: undefined,
				textColor: undefined,
				textPosition: undefined,
				borderVisible: false,
				borderColor: undefined,
				borderWidth: undefined,
			}));
			this._dataInvalidated = false;
		}

		const layoutOptions = this._model.options().layout;

		this._data.visibleRange = null;
		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		if (this._data.items.length === 0) {
			return;
		}
		let prevTimeIndex = NaN;
		const shapeMargin = calculateShapeMargin(timeScale.barSpacing());
		const offsets: Offsets = {
			aboveBar: shapeMargin,
			belowBar: shapeMargin,
			top: Constants.AxisMargin,
			bottom: Constants.AxisMargin,
		};
		this._data.visibleRange = visibleTimedValues(this._data.items, visibleBars, true);
		for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
			const marker = seriesMarkers[index];
			if (marker.time !== prevTimeIndex) {
				// new bar, reset stack counter
				offsets.aboveBar = shapeMargin;
				offsets.belowBar = shapeMargin;
				prevTimeIndex = marker.time;
			}

			const rendererItem = this._data.items[index];
			rendererItem.x = timeScale.indexToCoordinate(marker.time);
			rendererItem.borderColor = marker.borderColor;
			rendererItem.borderVisible = marker.borderVisible;
			rendererItem.borderWidth = marker.borderWidth;
			if (marker.text !== undefined && marker.text.length > 0) {
				rendererItem.text = {
					content: marker.text,
					y: 0 as Coordinate,
					width: 0,
					height: 0,
					color: marker.textColor ?? marker.color,
				};
			}
			const dataAt = this._series.dataAt(marker.time);
			if (dataAt === null) {
				continue;
			}
			//
			fillSizeAndY(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, priceScale, timeScale, firstValue.value);
		}
		this._invalidated = false;
	}
}
