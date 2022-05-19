import { OriginalTime } from './time-data';

/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerPosition = 'aboveBar' | 'belowBar' | 'inBar' | 'top' | 'bottom';

/**
 * Represents the position of a text relative to a marker.
 */
export type SeriesMarkerTextPosition = 'auto' | 'insideMarker';

/**
 * Represents the shape of a series marker.
 */
export type SeriesMarkerShape = 'circle' | 'square' | 'roundedSquare' | 'arrowUp' | 'arrowDown';

/**
 * Represents a series marker.
 */
export interface SeriesMarker<TimeType> {
	/**
	 * The time of the marker.
	 */
	time: TimeType;
	/**
	 * The position of the marker.
	 */
	position: SeriesMarkerPosition;
	/**
	 * The shape of the marker.
	 */
	shape: SeriesMarkerShape;
	/**
	 * The color of the marker.
	 */
	color: string;
	/**
	 * The visibility of the marker border
	 * It's actual for non arrow shapes
	 */
	borderVisible?: boolean;
	/**
	 * The color of the border
	 */
	borderColor?: string;
	/**
	 * The width of the border relative to the size
	 */
	borderWidth?: number;
	/**
	 * The ID of the marker.
	 */
	id?: string;
	/**
	 * The optional text of the marker.
	 */
	text?: string;
	/**
	 * The color of the text of the marker.
	 */
	textColor?: string;
	/**
	 * The optional position of the text of the marker.
	 *
	 * @defaultValue `'auto'`
	 */
	textPosition?: SeriesMarkerTextPosition;
	/**
	 * The optional size of the marker.
	 *
	 * @defaultValue `1`
	 */
	size?: number;

	/**
	 * @internal
	 */
	originalTime: OriginalTime;
}

export interface InternalSeriesMarker<TimeType> extends Omit<SeriesMarker<TimeType>, 'originalTime'> {
	internalId: number;
}
