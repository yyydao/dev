import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import './index.scss'
import { reqPost, reqGet,reqDelete,reqPostURLEncode } from '@/api/api'
import toPairs from 'lodash.topairs'
import uniq from 'lodash.uniq'
import { setStep,removeSteps,setSteps } from '@/store/action'

import { Chart, Geom, Axis, Tooltip, Legend, Coord, track } from 'bizcharts';

import {
    Steps,
    Breadcrumb,
    Card,
    Button,
    Icon,
    Collapse,
    Row,
    Col,
    Select,
    Menu,
    message,
    Dropdown,
    Radio,
    Modal
} from 'antd'

const BreadcrumbItem = Breadcrumb.Item
const Step = Steps.Step
const Panel = Collapse.Panel
const Option = Select.Option

const enumStepsText = [{
    title: '开始',
    content: 'First-content',
}, {
    title: '构建阶段',
    content: 'Second-content',
}, {
    title: '测试阶段',
    content: 'Last-content',
}, {
    title: '部署阶段',
    content: 'Second-content',
}, {
    title: '完成',
    content: 'Last-content',
}]

const enumStatus = {
    0: 'wait',
    1: 'process',
    2: 'finish',
    3: 'error'
}
const enumStatusText = {
    0: '未开始',
    1: '执行中',
    2: '结束'
}


const enumPipelineResult={
    0:`default`,
    1:`成功`,
    2:`失败`,
    3:`取消`,
    4:`不稳定`,

}

const enumPipelineResultColor={
    0:`#fff`,
    1:`#52c41a`,
    2:`#f5222d`,
    3:`#faad14`,
    4:`#1890ff`,

}

const enumButtonType = {
    0: 'wait',
    1: 'process',
    2: 'finish',
    3: 'error'
}

const enumButtonText = {
    0: '开始执行',
    1: '执行中',
    2: '开始执行',
    3: '开始执行'
}

const menu = (
    <Menu>
        <Menu.Item>
            <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">编辑任务</a>
        </Menu.Item>
        <Menu.Item>
            <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">删除任务</a>
        </Menu.Item>
    </Menu>
);

track(false);

class pipelineDetail extends Component {
    constructor (props) {
        super(props)

        this.state = {
            waitCount:0,
            delModalVisible:false,
            breadcrumbPath: [],
            historyBranch:[],
            envList: [],
            current: 0,
            finalStep: [],
            stepsList:[],
            fullSteps:[],
            buildNumber: '',
            exexTime:'',
            timer: null,
            timerStart: null,
        }
    }


    pipelineRunStatusText = (taskStatus,taskResult) =>{
        return (taskStatus === 2 || taskStatus=== '2') ? enumPipelineResult[taskResult]:enumStatusText[taskStatus]
    }

    pipelineStepCurrent = (taskStatus,taskResult) =>{

    }

    pipelineStepStatus = (taskStatus,taskResult) =>{
        return (taskStatus === 2 || taskStatus=== '2') ? enumPipelineResult[taskResult]:enumStatusText[taskStatus]
    }

    handleChange = (value) => {
        console.log(`selected ${value}`)
    }

    handleBlur = () => {
        console.log('blur')
    }

    handleFocus = () => {
        console.log('focus')
    }

    showModal = () => {
        this.setState({
            delModalVisible: true,
        })
    }

    hideModal = () => {
        this.setState({
            delModalVisible: false
        })
    }

    gotoEditPipeline = () =>{
        localStorage.setItem('currentEditedPipeline',JSON.stringify({
            fullSteps: this.state.fullSteps,
            stepsList : this.state.stepsList
        }))
        this.props.history.push({
            pathname: `/pipeline/edit/${this.props.match.params.taskID}`,
            state: {
                fullSteps: this.state.fullSteps,
                stepsList : this.state.stepsList,
                branchName:this.state.branchName
            },
        })
    }

    getPipelineDetail = () => {
        const {timer } = this.state;
        if (timer) {
            clearTimeout(timer);
            this.setState({
                timer: null
            });
        }


        reqGet('/pipeline/taskdetail', {
            taskID: this.props.match.params.taskID
        }).then((res) => {
            if (res.code === 0) {
                const taskList = res.task
                const stepsList = res.steps
                this.checkTaskList(taskList)
                this.checkStepList(stepsList)

                this.setState({
                    timer: taskList &&  taskList.taskStatus !== 2 && (new Date().getTime() - this.state.timerStart < 3600000) ? setTimeout(this.getPipelineDetail, 10e3) : null
                })

            }
        })
    }
    makeStepCard = (stepsList) => {

        const category = uniq(stepsList.map(item => item.stepCategory))
        // console.log(category)
        let tempStepObject = {}
        let finalStep = []
        category.forEach((value, index) => {
            tempStepObject[value] = []
        })
        for (let i = 0; i < stepsList.length; i++) {
            const stepListElement = stepsList[i]
            for (const tempStepObjectKey in tempStepObject) {
                if (stepListElement.stepCategory + '' === tempStepObjectKey + '') {
                    tempStepObject[tempStepObjectKey].push(stepListElement)
                }
            }

        }
        finalStep = toPairs(tempStepObject)
        console.log(finalStep)
        this.setState({stepsList: stepsList})
        this.setState({finalStep: finalStep})
        this.setState({fullSteps: this.composeEditFinalStep(finalStep)})
    }
    getPipelineRunStatus = (stepsList)=>{
        reqGet('/pipeline/taskstatus',{
            taskID: this.props.match.params.taskID
        }).then((res) => {
            if (res.code === 0) {

                let statusList = res.list
                console.log(statusList)
                let temparray = []
                statusList.map((statusItem)=>{
                    temparray.push(Object.assign({},stepsList.find((finalStepItem)=>finalStepItem.stepCode===statusItem.stepCode),statusItem))
                })
                this.makeStepCard(temparray)
            }
        })
    }
    getPackageresult = () => {
    }

    handleDeletePipeline = () =>{
        reqDelete(`/pipeline/deletetask/${this.props.match.params.taskID}`).then((res) => {
            if (res.code === 0) {
                this.props.history.push(`/pipeline`)
            }else{
                message.error(res.msg)
            }
        })
    }

    getHistoryList = ()=>{
        reqGet('/pipeline/taskrecordselect',{
            taskID:this.props.match.params.taskID
        }).then((res)=>{
                if (res.code === 0) {
                    this.setState({waitCount:res.count})
                    this.setState({historyBranch:res.data})
                }
        })
    }
    changeHistory = (buildNum)=>{
        clearTimeout(this.state.timer);
        this.getHistoryDetail(buildNum)
    }

    getHistoryDetail = (buildNum) =>{
        if(buildNum === 0){
           message.info(`等待中任务无数据`)
        }else{
            reqGet('/pipeline/taskhistorydetail',{
                taskID:this.props.match.params.taskID,
                buildNum: buildNum
            }).then((res)=>{
                if (res.code === 0) {
                    let data = res.data
                    let list = res.list

                    data && this.setState({exexTime:data.execTime})
                }
            })
        }

    }

    checkTaskList = (taskList) => {
        const {
            projectID,
            taskCode,
            taskName,
            jenkinsJob,
            branchName,
            branchID,
            taskStatus,
            taskResult,
            exexTime,
            lastExecTime,
            createTime,
            updateTime

        } = taskList
        this.setState({
            projectID,
            taskCode,
            taskName,
            jenkinsJob,
            branchName,
            branchID,
            taskStatus,
            taskResult,
            exexTime,
            lastExecTime,
            createTime,
            updateTime
        })
    }

    checkStepList = (stepsList) => {
        this.getPipelineRunStatus(stepsList)
    }

    runTask = () => {

        reqPostURLEncode('/pipeline/taskbuild', {
            taskID: this.props.match.params.taskID

        }).then((res) => {
            console.log(res)
            if (res.code === 0) {
                this.setState({taskStatus: 1})
                message.success('开始执行')
                setTimeout(this.getPipelineDetail,10e3)
            }else{
                message.error(res.msg)
            }
        })
    }

    composeEditFinalStep= (oldFinalStep) => {
        if(oldFinalStep.length === 0){
            oldFinalStep = [["1", []],
                ["2", []],
                ["3", []]]
        } else if(oldFinalStep.length === 1){
            if(oldFinalStep[0][0] === "1"){
                oldFinalStep.splice(1,0,["2",[]],["3",[]])
            }else if(oldFinalStep[0][0] === "2"){
                oldFinalStep.splice(0,0,["1",[]])
                oldFinalStep.splice(2,0,["3",[]])
            }else if(oldFinalStep[0][0] === "3"){
                oldFinalStep.splice(1,0,["2",[]])
                oldFinalStep.splice(2,0,["3",[]])
            }
        }else if(oldFinalStep.length=== 2){
            let tempSum = 0
            for (let i = 0; i < oldFinalStep.length; i++) {
                const oldFinalStepElement = oldFinalStep[i]
                tempSum +=oldFinalStepElement[0]*1
            }
            switch (tempSum) {
                case 3:
                    oldFinalStep.splice(2,0,["3",[]])
                    break;
                case 4:
                    oldFinalStep.splice(1,0,["2",[]])
                    break;
                case 5:
                    oldFinalStep.splice(0,0,["1",[]])
                    break;
            }
        }
        return oldFinalStep
    }

    componentWillMount () {
    }

    componentDidMount () {
        this.getPipelineDetail()
        this.getPackageresult()
        this.getHistoryList()
        this.setState({
            timerStart: new Date().getTime()
        })
    }

    componentWillUnmount() {
        clearTimeout(this.state.timer);

        this.setState = (state,callback)=>{
            return;
        }
    }

    render () {
        const {
            delModalVisible,
            taskCode,
            taskID,
            taskName,
            jenkinsJob,
            branchName,
            taskStatus,
            taskResult,
            lastExecTime,
            finalStep,
            stepsList,
            waitCount
        } = this.state
        // 数据源
        const data = [
            { genre: 'Sports', sold: 275, income: 2300 },
            { genre: 'Strategy', sold: 115, income: 667 },
            { genre: 'Action', sold: 120, income: 982 },
            { genre: 'Shooter', sold: 350, income: 5271 },
            { genre: 'Other', sold: 150, income: 3710 }
        ];

// 定义度量
        const cols = {
            sold: { alias: '销售量' },
            genre: { alias: '游戏种类' }
        };

        return (
            <div>
                <Breadcrumb className="devops-breadcrumb">
                    <BreadcrumbItem><Link to="/home">首页</Link></BreadcrumbItem>
                    <BreadcrumbItem><Link to="/pipeline">流水线</Link></BreadcrumbItem>
                    <BreadcrumbItem>详情</BreadcrumbItem>
                </Breadcrumb>
                <Modal title="删除流水线"
                       visible={delModalVisible}
                       onOk={this.handleDeletePipeline}
                       onCancel={this.hideModal}
                       maskClosable={false}
                       destroyOnClose={true}
                >
                    <p>是否删除该流水线 ？</p>
                </Modal>
                <section className="pipeline-box">
                    <div className="pipeline-header">
                        <Row gutter={16} type="flex" justify="space-between" align="middle">
                            <Col>
                                <Row gutter={16} type="flex" justify="space-between" align="middle">
                                    <Col>
                                        <h2>流水线详情</h2>
                                    </Col>
                                    <Col><Button onClick={()=>{this.showModal()}} ghost type="danger" shape="circle" icon="delete"/>
                                    </Col>
                                </Row>
                            </Col>
                            <Col>
                                <Row gutter={16} type="flex" justify="space-between" align="middle">
                                    <Col>
                                        <span>Tips: 有{waitCount}个任务正在等待</span>
                                    </Col>
                                    <Col>
                                        <Button disabled={taskStatus===1}
                                            type="primary" onClick={()=>{
                                            this.gotoEditPipeline()
                                        }}>编辑</Button>
                                    </Col>
                                    <Col>

                                        <Select placeholder="请选择构建历史"
                                                onChange={this.changeHistory}
                                                style={{width: 300}}>
                                            {
                                                this.state.historyBranch.map((item) => {
                                                    return <Option
                                                        title={item.buildNum+''}
                                                        value={item.buildNum}
                                                        key={item.buildNum}
                                                    >{item.updateTime}</Option>
                                                })
                                            }
                                        </Select>
                                    </Col>
                                </Row>

                            </Col>
                        </Row>
                    </div>
                    <section className="pipeline-main">
                        <div className="pipeline-item">

                            <div className="pipeline-item-header">
                                <Row type="flex" justify="space-between">
                                    <Col span={12}>
                                        <h2>{taskName} <span>（ID：{taskCode}）</span></h2>
                                    </Col>
                                    <Col span={12}>
                                        <div className="pipeline-item-user">
                                            {/*gitlab push by liaoshengjian*/}
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                            <div className="pipeline-item-content">
                                <Row>
                                    <Col span={20}>
                                        <div className="pipeline-item-main">
                                            <p className="pipeline-item-timemeta">
                                                <span><i>最近执行时间：</i>{lastExecTime}</span>
                                                <span><i>执行分支：</i>{branchName}</span>
                                                <span><i>最近执行时长：</i>{this.state.exexTime}</span>
                                            </p>

                                        </div>
                                    </Col>
                                    <Col span={4}>
                                        <div className="pipeline-item-ctrl">

                                            <Row gutter={16} type="flex" justify="space-between" align="middle">
                                                <Col>
                                                    <span>最近执行状态：</span>{this.pipelineRunStatusText(taskStatus,taskResult)}
                                                </Col>
                                                <Col>
                                                    <Button disabled={taskStatus===1} type="primary" onClick={()=>this.runTask()}>{enumButtonText[taskStatus]}</Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                </Row>
                                <Steps size="small"
                                       status={enumStatus[taskStatus]}
                                       labelPlacement="vertical"
                                       current={taskStatus === 2? 5:taskStatus}>
                                    <Step title="开始"></Step>

                                    {finalStep.map((item, index) => {
                                        return <Step title={enumStepsText[item[0]].title} key={index} description={
                                            item[1].map((item, index) => {
                                                // console.log(item)
                                                return <Card
                                                        style={{width: 150, marginLeft: '-18%',background:enumPipelineResultColor[item.stepResult]}}
                                                        title={item.stepName}
                                                        key={item.stepID}
                                                    >
                                                        <p>{item.stepDesc}</p>
                                                    </Card>
                                            })

                                        }>

                                        </Step>
                                    })}
                                    <Step title="完成" description={<div></div>}></Step>
                                </Steps>
                            </div>

                        </div>
                    </section>
                </section>
                <section className="pipeline-box">
                    <Card title="基本信息">
                    </Card>
                </section>
                <section className="pipeline-box" id="scan-result">
                    <Card title="基本信息">
                        <Chart width={600} height={400} data={data} scale={cols}>
                            <Axis name="genre" />
                            <Axis name="sold" />
                            <Legend position="top" dy={-20} />
                            <Tooltip />
                            <Geom type="interval" position="genre*sold" color="genre" />
                        </Chart>
                    </Card>
                </section>
            </div>
        )
    }
}

pipelineDetail = connect((state) => {
    return {
        taskID: state.taskID
    }
},{setStep,removeSteps,setSteps})(pipelineDetail)

export default pipelineDetail
