import React from 'react';
import './App.css';
import TopologyComponent, {TopologyItem, TopologyLink} from "./components/topology";
import "antd/dist/antd.css";
import {Button, Form, Input} from "antd";
import {FormInstance} from "antd/es/form";

interface AppProps {

}

interface AppState {
    datas: TopologyItem[],
    links: TopologyLink[],
    result: string,
}

class App extends React.PureComponent<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.deleteNode = this.deleteNode.bind(this)
        this.addNode = this.addNode.bind(this)
        this.addLink = this.addLink.bind(this)
        this.deleteLink = this.deleteLink.bind(this)
        this.exportTopology = this.exportTopology.bind(this)
        this.importTopology = this.importTopology.bind(this)
        this.onResultChange = this.onResultChange.bind(this)
        this.onDataClick = this.onDataClick.bind(this)
        this.onLinkClick = this.onLinkClick.bind(this)
        this.state = {
            datas: [],
            links: [],
            result: ""
        }
    }

    formNode = React.createRef<FormInstance>();
    formLink = React.createRef<FormInstance>()

    onFinish = (values: any) => {
        console.log(values);
    };


    addNode(e: any) {
        this.formNode.current?.validateFields()
            .then(() => {
                let {name, x, y} = this.formNode.current?.getFieldsValue(true)
                this.setState(prevState => {
                    prevState.datas.filter(value => {
                        return value.id !== name
                    })
                    return {
                        datas: prevState.datas.filter(value => {
                            return value.id !== name
                        }).concat({
                            id: name,
                            name: name,
                            x: x,
                            y: y,
                        })
                    }
                })
            })
            .catch(err => {

            })
    }

    deleteNode(e: any) {
        let {name} = this.formNode.current?.getFieldsValue(true)

        this.setState(prevState => {
            return {
                datas: prevState.datas.filter(value => {
                    return value.id !== name
                })
            }
        })
    }

    addLink(e: any) {
        this.formLink.current?.validateFields()
            .then(() => {
                let item = this.formLink.current?.getFieldsValue(true)
                item.name = `${item.bandwidth}Mbps / ${item.delay}ms`
                item.value = item.name
                item.label = {
                    show: true,
                    formatter: '{@score}',
                    fontSize: 12
                }
                if (item.source === item.target) {
                    return Promise.reject()
                }
                this.setState(prevState => {
                    if (prevState.datas.filter(value => value.name === item.source).length <= 0 ||
                        prevState.datas.filter(value => value.name === item.target).length <= 0) {
                        return {
                            links: prevState.links
                        }
                    } else {
                        return {
                            links: prevState.links.filter(value => {
                                return value.source !== item.source || value.target !== item.target
                            }).concat(item)
                        }
                    }
                })
            })
            .catch(err => {

            })
    }

    deleteLink(e: any) {
        let item = this.formLink.current?.getFieldsValue(true)
        this.setState((prevState, props) => {
            return {
                links: prevState.links.filter(value => {
                    return value.source !== item.source || value.target !== item.target
                })
            }
        })
    }

    onResultChange(e: any) {
        this.setState((prevState, props) => {
            return {
                result: e.target.value
            }
        })
    }

    exportTopology(e: any) {
        this.setState(prevState => {
            const {
                datas,
                links
            } = prevState;
            let newResult =
                `router

# node  comment     yPos     xPos`
            for (let i = 0; i < datas.length; i++) {
                newResult += `\n${datas[i].name}\tNA\t${datas[i].y}\t${datas[i].x}`
            }
            newResult += `\n\nlink

# srcNode   dstNode     bandwidth   metric  delay   queue`
            for (let i = 0; i < links.length; i++) {
                newResult += `\n${links[i].source}\t${links[i].target}\t${links[i].bandwidth}Mbps\t${links[i].metric}\t${links[i].delay}ms\t${links[i].queue}`
            }
            newResult += "\n"
            return {
                result: newResult
            }
        })
    }

    importTopology(e: any) {
        let mode: "node" | "link" | "none" = "none"
        let lines = this.state.result.split("\n")
        let datas: TopologyItem[] = []
        let links: TopologyLink[] = []
        for (let i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trim()
            if (lines[i].startsWith("#") || !lines[i]) {
                continue
            }
            if (mode === "none") {
                if (lines[i].startsWith("router")) {
                    mode = "node"
                    continue
                }
            } else if (mode === "node") {
                if (lines[i].startsWith("link")) {
                    mode = "link"
                    continue
                }
                let items = lines[i].split("\t");
                items.map(item => item.trim());
                if (items.length !== 4) {
                    items = lines[i].split(" ").map(item => item.trim())
                        .filter(item => !!item)
                }
                if (items.length === 4) {
                    datas.push({
                        id: items[0],
                        name: items[0],
                        x: parseInt(items[3]),
                        y: parseInt(items[2])
                    })
                }
            } else if (mode === "link") {
                let items = lines[i].split("\t");
                items.map(item => item.trim());
                if (items.length !== 6) {
                    items = lines[i].split(" ").map(item => item.trim())
                        .filter(item => !!item)
                }
                if (items.length === 6) {
                    let item: any = {
                        source: items[0],
                        target: items[1],
                        bandwidth: parseInt(items[2]),
                        metric: parseInt(items[3]),
                        delay: parseInt(items[4]),
                        queue: parseInt(items[5])
                    }

                    item.name = `${item.bandwidth}Mbps / ${item.delay}ms`
                    item.value = item.name
                    item.label = {
                        show: true,
                        formatter: '{@score}',
                        fontSize: 12
                    }
                    links.push(item);

                }
            }
        }
        this.setState({
            datas: datas,
            links: links
        })
    }

    onDataClick(data: TopologyItem) {
        if (!!data.symbolSize && data.symbolSize === 0) {
            return
        }
        this.formNode.current?.setFieldsValue({
            ...data
        })
    }

    onLinkClick(link: TopologyLink) {
        if (!!link?.lineStyle) {
            return
        }
        this.formLink.current?.setFieldsValue({
            ...link
        })
    }

    render() {
        const {
            datas,
            links,
            result
        } = this.state;
        return (

            <div className="App" style={{
                display: "flex"
                ,
                flexDirection: "row"
                ,
            }
            }>
                <div style={{
                    height: window.innerHeight,
                    alignItems: "center",
                    justifyContent: "center",
                    display: "flex",
                    flexDirection: "column",
                    padding: 10,
                }}>
                    <div style={{
                        display: "flex",
                        // alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row"
                    }}>
                        <div>
                            <h2>Nodes</h2>
                            <Form name="control-ref" ref={this.formNode} onFinish={this.onFinish}>
                                <Form.Item name="name" label="Name" rules={[{required: true}]}>
                                    <Input placeholder={"Input node name here"}/>
                                </Form.Item>
                                <Form.Item name="x" label="x" rules={[{required: true}]}>
                                    <Input placeholder={"Input the x position of node here"} type={"number"}/>
                                </Form.Item>
                                <Form.Item name="y" label="y" rules={[{required: true}]}>
                                    <Input placeholder={"Input the y position of node here"} type={"number"}/>
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="button" onClick={this.addNode}>
                                        Add
                                    </Button>
                                    <Button type={"default"} htmlType="button" onClick={this.deleteNode}>
                                        Delete
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                        <div style={{
                            marginLeft: 20
                        }}>
                            <h2>Links</h2>
                            <Form name="control-ref" ref={this.formLink} onFinish={this.onFinish}>
                                <Form.Item name="source" label="Source" rules={[{required: true}]}>
                                    <Input placeholder={"Input srcNode here"}/>
                                </Form.Item>
                                <Form.Item name="target" label="Target" rules={[{required: true}]}>
                                    <Input placeholder={"Input dstNode here"}/>
                                </Form.Item>
                                <Form.Item name="bandwidth" label="Bandwidth(Mbps)" rules={[{required: true}]}
                                           initialValue={10}>
                                    <Input placeholder={"Input bandwidth of link here"} type={"number"}/>
                                </Form.Item>
                                <Form.Item name="metric" label="Metric" rules={[{required: true}]} initialValue={1}>
                                    <Input placeholder={"Input link cost here"} type={"number"}/>
                                </Form.Item>
                                <Form.Item name="delay" label="Delay(ms)" rules={[{required: true}]} initialValue={10}>
                                    <Input placeholder={"Input link delay here"} type={"number"}/>
                                </Form.Item>
                                <Form.Item name="queue" label="Queue(ms)" rules={[{required: true}]} initialValue={20}>
                                    <Input placeholder={"Input queue size here"} type={"number"}/>
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="button" onClick={this.addLink}>
                                        Add
                                    </Button>
                                    <Button type={"default"} htmlType="button" onClick={this.deleteLink}>
                                        Delete
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>

                    <Input.TextArea rows={10} value={result} onChange={this.onResultChange}/>
                    <div style={{
                        marginTop: 10
                    }}>
                        <Button type="primary" htmlType="button" onClick={this.exportTopology}>
                            Export
                        </Button>
                        <Button type={"default"} htmlType="button" onClick={this.importTopology}>
                            Import
                        </Button>
                    </div>
                </div>
                <TopologyComponent datas={datas} links={links} onDataClick={this.onDataClick}
                                   onLinkClick={this.onLinkClick}/>
            </div>
        );
    }
}

export default App;
