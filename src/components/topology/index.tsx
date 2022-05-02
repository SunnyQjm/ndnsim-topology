import React from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
// Import charts, all with Chart suffix
import {
    GraphChart,
} from 'echarts/charts';
import {
    TooltipComponent
} from "echarts/components";
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import {
    CanvasRenderer,
} from 'echarts/renderers';

// Register the required components
echarts.use(
    [GraphChart, TooltipComponent, CanvasRenderer]
);

export interface TopologyItem {
    id: number | string          // 节点的id
    name: string        // 节点的名字
    x: number           // 横坐标
    y: number           // 纵坐标
    symbolSize?: number
}

export interface TopologyLink {
    name?: string,
    source: string | number,
    target: string | number,
    bandwidth?: number
    metric?: number,
    delay?: number,
    queue?: number,
    label?: any
    lineStyle?: any
    value?: string
}

interface TopologyComponentProps {
    datas: TopologyItem[]
    links: TopologyLink[]
    onDataClick?: (data: TopologyItem) => void
    onLinkClick?: (link: TopologyLink) => void
}

interface TopologyComponentState {

}

function generateCoordinateSystem(minX: number, maxX: number, minY: number, maxY: number) {
    // @ts-ignore
    let data: TopologyItem[] = [];
    // @ts-ignore
    let links: any[] = [];
    for (let i = minX; i < maxX; i++) {
        data.push({
            name: `${i}`,
            id: `cs_x_min_${i}`,
            symbolSize: 0,
            y: minY,
            x: i,
        })
        data.push({
            name: `${i}`,
            id: `cs_x_max_${i}`,
            // symbol: "none",
            symbolSize: 0,
            y: maxY,
            x: i,
        })
        links.push({
            source: `cs_x_min_${i}`,
            target: `cs_x_max_${i}`,
            lineStyle: {
                type: "dashed",
                color: "#ddd",
            }
        })
    }
    for (let i = minY; i < maxY; i++) {
        data.push({
            name: `${maxY - i + minY}`,
            id: `cs_y_min_${i}`,
            symbolSize: 0,
            y: i,
            x: minX,
        })
        data.push({
            name: ``,
            id: `cs_y_max_${i}`,
            // symbol: "none",
            symbolSize: 0,
            y: i,
            x: maxX,
        })
        links.push({
            source: `cs_y_min_${i}`,
            target: `cs_y_max_${i}`,
            lineStyle: {
                type: "dashed",
                color: "#ddd",
            }
        })
    }
    return {
        data: data,
        links: links,
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
    }
}

// let res = generateCoordinateSystem(0, 0, 0, 0);


class TopologyComponent extends React.PureComponent<TopologyComponentProps, TopologyComponentState> {

    static defaultProps = {}

    constructor(props: TopologyComponentProps) {
        super(props);
        this.state = {}
        this.onChartClick = this.onChartClick.bind(this)
    }

    doGenerateCoordinateSystem() {
        let {datas} = this.props;
        if (datas.length === 0) {
            return generateCoordinateSystem(0, 15, 0, 15);
        }
        let minX = datas[0].x;
        let maxX = datas[0].x;
        let minY = datas[0].y;
        let maxY = datas[0].y;
        for (let i = 0; i < datas.length; i++) {
            minX = Math.min(minX, datas[i].x)
            maxX = Math.max(maxX, datas[i].x)
            minY = Math.min(minY, datas[i].y)
            maxY = Math.max(maxY, datas[i].y)
        }
        if (maxY - minY < 5) {
            maxY = minY + 5
        }
        if (maxX - minX < 5) {
            maxX = minX + 5
        }

        return generateCoordinateSystem(minX - 2, maxX + 2, minY - 2, maxY + 2)
    }

    onChartClick(params: any) {
        if (params.dataType === "node") {
            this.props.onDataClick?.({
                ...params.data,
                y: params.data.relY
            })
        } else if (params.dataType === "edge") {
            this.props.onLinkClick?.(params.data)
        }
    }

    render() {
        let {datas, links} = this.props;

        let res: any = this.doGenerateCoordinateSystem();
        let nodes = datas.map((item: any) => {
            return {
                ...item,
                y: res.maxY - item.y + res.minY,
                relY: item.y
            }
        });

        const option = {
            tooltip: {},
            animationDurationUpdate: 1500,
            animationEasingUpdate: 'quinticInOut',
            series: [
                {
                    type: 'graph',
                    layout: 'none',
                    symbolSize: 30,
                    roam: true,
                    label: {
                        normal: {
                            show: true
                        }
                    },
                    edgeSymbol: ['circle', 'line'],
                    edgeSymbolSize: [4, 10],
                    scaleLimit: {
                        min: 0.5,
                        max: 5,
                    },
                    edgeLabel: {
                        normal: {
                            textStyle: {
                                fontSize: 20
                            }
                        }
                    },
                    data: res.data.concat(nodes),
                    // links: [],
                    links: res.links.concat(links),
                    lineStyle: {
                        normal: {
                            opacity: 0.9,
                            width: 2,
                            curveness: 0
                        }
                    }
                }
            ]
        };
        return (
            <ReactEChartsCore
                onEvents={{
                    "click": this.onChartClick
                }}
                echarts={echarts}
                option={option} style={{height: window.innerHeight, width: '100%'}}/>
        )
    }
}

export default TopologyComponent