import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import './index.scss'
import { reqPost, reqGet,reqPostURLEncode } from '@/api/api'
import {formatTime ,compatibleTime } from '@/utils/utils'
import { Steps, Breadcrumb, Card, Button, Icon, Collapse, Row, Col, message } from 'antd'
import { Radio } from 'antd/lib/radio'

const BreadcrumbItem = Breadcrumb.Item
const Step = Steps.Step
const Panel = Collapse.Panel

const steps = [{
    title: '开始',
}, {
    title: '构建阶段',
}, {
    title: '测试阶段',
}, {
    title: '部署阶段',
}, {
    title: '完成',
}]

const enumStatus = {
    0: 'wait',
    1: 'process',
    2: 'finish',
    3: 'error'
}
// const enumStatusText = {
//     0: '未开始',
//     1: '执行中',
//     2: '成功',
//     3: '失败'
// }

const enumButtonType = {
    0: 'wait',
    1: 'process',
    2: 'error',
    3: 'finish'
}

const enumButtonText = {
    0: '开始执行',
    1: '执行中',
    2: '开始执行',
    3: '开始执行'
}

const enumStatusText = {
    0: '未开始',
    1: '执行中',
    2: '结束'
}


const enumPipelineResult={
    0:`未开始`,
    1:`成功`,
    2:`失败`,
    3:`取消`,
    4:`不稳定`,

}


class Pipeline extends Component {
    constructor (props) {
        super(props)

        this.state = {
            pipelineList: [],
            current: 0,
        }
    }

    pipelineRunStatusText = (taskStatus,taskResult) =>{
        return (taskStatus === 2 || taskStatus=== '2') ? enumPipelineResult[taskResult]:enumStatusText[taskStatus]
    }

    getPipelineList = () => {
        reqGet('/pipeline/tasklist', {
            projectID: this.props.projectId,
            page: 1,
            limit: 20,
        }).then((res) => {
            console.log(res)
            if (res.code === 0) {
                if(res.data.list){
                    let list = res.data.list
                    for (let i = 0; i < list.length; i++) {
                        const listElement = list[i]
                        list[i].distanceTime = formatTime(listElement.lastExecTime,'minute')
                    }
                    this.setState({
                        pipelineList: list
                        // pipelineList: res.tasks
                    })
                }

            }else{
                message.error(res.msg)
            }
        })
    }



    runTask = (item) => {

        this.setState({taskStatus: 1})
        reqPostURLEncode('/pipeline/taskbuild', {
            taskID: item.taskID

        }).then((res) => {
            console.log(res)
            if (res.code === 0) {
                message.success('开始执行')
                let pipelineList = this.state.pipelineList
                for (let i = 0; i < pipelineList.length; i++) {
                    const pipelineItem = pipelineList[i]
                    if(pipelineItem.taskID === item.taskID){
                        pipelineList[i].taskStatus = 1
                    }
                }
                this.setState({pipelineList:pipelineList})
                // this. getPipelineList()
            }else{
                message.error(res.msg)
            }
        })
    }

    componentWillMount () {
        window.localStorage.removeItem('currentEditedPipeline')
        window.localStorage.removeItem('steps')
        window.localStorage.setItem('oldProjectId', this.props.projectId)
    }

    componentDidMount () {
        this.getPipelineList()
    }

    render () {
        const {pipelineList} = this.state

        return (
            <div>
                <Breadcrumb className="devops-breadcrumb">
                    <BreadcrumbItem><Link to="/home">首页</Link></BreadcrumbItem>
                    <BreadcrumbItem>流水线</BreadcrumbItem>
                </Breadcrumb>

                <div className="pipeline-menu">
                    <Button type="primary"><Link to={`/pipeline/add`}>新增流水线</Link></Button>
                </div>
                <section className="pipeline-box">
                    <section className="pipeline-main">
                        {
                            pipelineList.map((item, index) => {
                                return <div className="pipeline-item" key={index}>

                                    <div className="pipeline-item-header">
                                        <Row type="flex" justify="space-between">
                                            <Col span={12}>
                                                <Link to={`/pipeline/detail/${item.taskID}`}><h2>{item.taskName}
                                                    <span>（ID：{item.taskCode}）</span></h2></Link>
                                            </Col>
                                            <Col span={12}>
                                                <div className="pipeline-item-user">
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                    <div className="pipeline-item-content">
                                        <Row>
                                            <Col span={20}>
                                                <div className="pipeline-item-main">
                                                    <p className="pipeline-item-timemeta">
                                                        <span><i>最近执行时间：</i>{item.distanceTime}</span>
                                                        <span><i>执行分支：</i>{item.branchName}</span>
                                                        <span><i>最近执行时长：</i>{item.execTimeStr}</span>
                                                    </p>
                                                    <Steps size="small" status={enumStatus[item.taskStatus]}
                                                           current={item.taskStatus === 2? 5:item.taskStatus}>
                                                        {steps.map((item, index) => <Step key={index}
                                                                                          title={item.title}/>)}
                                                    </Steps>
                                                </div>
                                            </Col>
                                            <Col span={4}>
                                                <div className="pipeline-item-ctrl">
                                                    <div className="status">
                                                        <span>最近执行状态：</span>{this.pipelineRunStatusText(item.taskStatus,item.taskResult)}</div>
                                                    <Button type="primary" disabled={item.taskStatus === 1} onClick={()=>this.runTask(item)}>{enumButtonText[item.taskStatus]}</Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                </div>
                            })
                        }
                    </section>
                </section>
            </div>
        )
    }
}

Pipeline = connect((state) => {
    return {
        projectId: state.projectId
    }
})(Pipeline)

export default Pipeline
