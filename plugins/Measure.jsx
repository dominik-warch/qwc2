/**
 * Copyright 2016-2024 Sourcepole AG
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {connect} from 'react-redux';

import PropTypes from 'prop-types';

import {setSnappingConfig} from '../actions/map.js';
import {changeMeasurementState} from '../actions/measurement.js';
import TaskBar from '../components/TaskBar';
import ButtonBar from '../components/widgets/ButtonBar';
import CopyButton from '../components/widgets/CopyButton';
import CoordinatesUtils from '../utils/CoordinatesUtils.js';
import LocaleUtils from '../utils/LocaleUtils';
import MeasureUtils from '../utils/MeasureUtils';

import './style/Measure.css';


/**
 * Allows measuring points/lines/areas on the map.
 */
class Measure extends React.Component {
    static propTypes = {
        /** Head marker of bearing line measurement geometry. Can be one of `OUTARROW`, `INARROW`, `LINE`. */
        bearingHeadMarker: PropTypes.string,
        /** Tail marker of bearing line measurement geometry. Can be one of `OUTARROW`, `INARROW`, `LINE`. */
        bearingTailMarker: PropTypes.string,
        changeMeasurementState: PropTypes.func,
        displayCrs: PropTypes.string,
        /** Head marker of distance line measurement geometry. Can be one of `OUTARROW`, `INARROW`, `LINE`. */
        lineHeadMarker: PropTypes.string,
        /** Tail marker of distance line measurement geometry. Can be one of `OUTARROW`, `INARROW`, `LINE`. */
        lineTailMarker: PropTypes.string,
        mapCrs: PropTypes.string,
        measureState: PropTypes.object,
        setSnappingConfig: PropTypes.func,
        /** Whether to show the widget to switch between measure modes. */
        showMeasureModeSwitcher: PropTypes.bool,
        /** Whether snapping is available when editing. */
        snapping: PropTypes.bool,
        /** Whether snapping is enabled by default when editing.
         *  Either `false`, `edge`, `vertex` or `true` (i.e. both vertex and edge). */
        snappingActive: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
    };
    static defaultProps = {
        showMeasureModeSwitcher: true,
        snapping: true,
        snappingActive: true
    };
    onShow = (mode) => {
        this.props.changeMeasurementState({
            geomType: mode || 'Point',
            bearingHeadMarker: this.props.bearingHeadMarker,
            bearingTailMarker: this.props.bearingTailMarker,
            lineHeadMarker: this.props.lineHeadMarker,
            lineTailMarker: this.props.lineTailMarker
        });
        this.props.setSnappingConfig(this.props.snapping, this.props.snappingActive);
    };
    onHide = () => {
        this.props.changeMeasurementState({geomType: null});
    };
    setMeasureMode = (geomType) => {
        if (geomType !== this.props.measureState.geomType) {
            this.props.changeMeasurementState({geomType: geomType});
        }
    };
    changeLengthUnit = (ev) => {
        this.props.changeMeasurementState({...this.props.measureState, lenUnit: ev.target.value});
    };
    changeAreaUnit = (ev) => {
        this.props.changeMeasurementState({...this.props.measureState, areaUnit: ev.target.value});
    };
    renderModeSwitcher = () => {
        if (!this.props.showMeasureModeSwitcher) {
            return null;
        }
        const buttons = [
            {key: "Point", label: LocaleUtils.tr("measureComponent.pointLabel")},
            {key: "LineString", label: LocaleUtils.tr("measureComponent.lengthLabel")},
            {key: "Polygon", label: LocaleUtils.tr("measureComponent.areaLabel")},
            {key: "Bearing", label: LocaleUtils.tr("measureComponent.bearingLabel")}
        ];
        return (
            <ButtonBar active={this.props.measureState.geomType} buttons={buttons} onClick={this.setMeasureMode} />
        );
    };
    renderResult = () => {
        let text = "";
        let unitSelector = null;

        if (this.props.measureState.geomType === "Point") {
            const coo = this.props.measureState.coordinates || [0, 0];
            text = CoordinatesUtils.getFormattedCoordinate(coo, this.props.mapCrs, this.props.displayCrs);
        } else if (this.props.measureState.geomType === "LineString") {
            const length = this.props.measureState.length || 0;
            text = MeasureUtils.formatMeasurement(length, false, this.props.measureState.lenUnit);
            unitSelector = (
                <select onChange={this.changeLengthUnit} value={this.props.measureState.lenUnit}>
                    <option value="metric">{LocaleUtils.tr("measureComponent.metric")}</option>
                    <option value="imperial">{LocaleUtils.tr("measureComponent.imperial")}</option>
                    <option value="m">m</option>
                    <option value="km">km</option>
                    <option value="ft">ft</option>
                    <option value="mi">mi</option>
                </select>
            );
        } else if (this.props.measureState.geomType === "Polygon") {
            const area = this.props.measureState.area || 0;
            text = MeasureUtils.formatMeasurement(area, true, this.props.measureState.areaUnit);
            unitSelector = (
                <select onChange={this.changeAreaUnit} value={this.props.measureState.areaUnit}>
                    <option value="metric">{LocaleUtils.tr("measureComponent.metric")}</option>
                    <option value="imperial">{LocaleUtils.tr("measureComponent.imperial")}</option>
                    <option value="sqm">m&#178;</option>
                    <option value="ha">ha</option>
                    <option value="sqkm">km&#178;</option>
                    <option value="sqft">ft&#178;</option>
                    <option value="acre">acre</option>
                    <option value="sqmi">mi&#178;</option>
                </select>
            );
        } else if (this.props.measureState.geomType === "Bearing") {
            text = MeasureUtils.getFormattedBearingValue(this.props.measureState.bearing);
        }
        return (
            <div className="measure-result controlgroup">
                <input className="measure-result-field" readOnly type="text" value={text} />
                {unitSelector}
                <CopyButton text={text} />
            </div>
        );
    };
    renderBody = () => {
        return (
            <div className="measure-body">
                {this.renderModeSwitcher()}
                {this.renderResult()}
            </div>
        );
    };
    render() {
        return (
            <TaskBar onHide={this.onHide} onShow={this.onShow} task="Measure">
                {() => ({
                    body: this.renderBody()
                })}
            </TaskBar>
        );
    }
}

export default connect((state) => ({
    measureState: state.measurement,
    mapCrs: state.map.projection,
    displayCrs: state.map.displayCrs
}), {
    changeMeasurementState: changeMeasurementState,
    setSnappingConfig: setSnappingConfig
})(Measure);
