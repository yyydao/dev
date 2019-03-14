import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import './index.scss'
import { reqGet, reqPost } from '@/api/api'
import { setTestBuildType } from '@/store/actions/project'

import {
  Breadcrumb,
  Button,
  Modal,
  Select,
  Row,
  Col,
  Table,
  message,
  Popover
} from 'antd'
import { bindActionCreators } from 'redux'

const BreadcrumbItem = Breadcrumb.Item
const Option = Select.Option

class PerformanceBranchTest extends Component {
  constructor (props) {
    super(props)

    this.state = {
      projectId: props.projectId,
      testBuildType: 'branch',
      curPage: 1,

      columns: [
        {
          title: 'ID',
          dataIndex: 'demandID',
          width: '8%',
          key: 'demandID'
        },
        {
          title: '分支',
          dataIndex: 'branch',
          key: 'branch',
          width: '20%'
        },
        {
          title: '版本',
          dataIndex: 'version',
          key: 'version',
          width: '8%'
        },
        {
          title: '环境',
          dataIndex: 'env',
          key: 'env',
          width: '10%',
        },
        {
          title: '场景',
          dataIndex: 'scene',
          key: 'scene',
          width: '8%',
          render: (text) => <Popover content={<p style={{ width: 180, marginBottom: 0 }}>{text}</p>}
                                     trigger="hover">
            <Button type="primary" ghost={true} shape="circle" icon="info"
                    style={{ fontSize: 12, marginRight: 24, width: 20, height: 20 }}/>
          </Popover>
        },
        {
          title: '创建人',
          dataIndex: 'creator',
          key: 'creator',
          width: '6%'
        },
        {
          title: '时间',
          dataIndex: 'time',
          key: 'time',
          width: '10%'
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: '10%'
        }, {
          title: '机型',
          dataIndex: 'type',
          key: 'type',
          width: '10%'
        },
        {
          title: '操作',
          width: '10%',
          render: (text, record) => <div><a>删除</a><span style={{ color: '#eee' }}> | </span><a>下载</a></div>
        }
      ],
      listData: [{
        demandID: '110',
        branch: 'origin/developer/developer_main',
        version: '5.4.2',
        env: '测试',
        scene: '检查各一级页面，登录相关，签到',
        creator: '林淼润',
        time: '2019-01-19 20:00:00',
        status: '等待中',
        type: '组合',
        list: [
          {
            demandID: '',
            branch: '',
            version: '',
            env: '',
            scene: '',
            creator: '',
            time: '',
            status: '',
            type: 'iphone6',
          },
          {
            demandID: '',
            branch: '',
            version: '',
            env: '',
            scene: '',
            creator: '',
            time: '',
            status: '',
            type: 'iphone7',
          }
        ]
      }],

      // 分支列表
      branchList: [],
      branchID: "-1",
      //环境列表
      envList: [],
      envID: -1,
      //版本列表
      versionList: [],
      versionID: -1,
      //状态集合
      statusList: [],
      status: -2,
      // 机型列表
      modalList: [],
      modal: '-1'
    }
  }

  /**
   * @desc 获取表格数据
   */
  getTableData = () => {
    this.setState({ loading: true })

  }

  /**
   * @desc  新建测试，跳转到新增页面
   */
  goToAdd = () => {
    this.props.history.push({
      pathname: '/performanceConfig/add',
      state: {
        type: 'branch'
      }
    })
  }

  /**
   * @desc 获取环境列表
   */
  getEnvList = () => {
    const { projectId } = this.state
    reqGet('/performance/env/listall', { projectID: projectId }).then(res => {
      if (res.code === 0) {
        let id = ''
        //钉钉进入该页面时，会带来一个envID，否则默认为全部
        if (this.state.envID) {
          id = this.state.envID
        } else {
          id = res.data && res.data[0] && res.data[0].code
        }
        this.setState({
          envList: res.data,
          envID: id
        }, () => {
          this.getVersionList()
        })
      } else {
        message.error(res.msg)
      }
    })
  }
  /**
   * @desc 修改环境
   */
  changeEnv = (envID) => {
    this.setState({
      envID
    }, () => {
      this.getList()
    })
  }

  /**
   * @desc 获取分支列表
   */
  getBranchList = (value = '') => {
    reqGet('/performance/task/branchs', {
      projectID: this.props.projectId,
      buildType: 1
    }).then(res => {
      if (res.code === 0) {
        let id = ''
        //钉钉进入该页面时，会带来一个envID，否则默认为全部
        if (this.state.branchID) {
          id = this.state.branchID
        } else {
          id = res.data && res.data[0] && res.data[0].code
        }

        this.setState({
          branchList: res.data,
          branchID: id,
        })
      }
    })
  }

  /**
   * @desc 修改选中分支
   */
  changeBranch = (branchID) => {
    this.setState({
      branchID
    }, () => {
      this.getList()
    })
  }

  /**
   * @desc 获取版本列表
   */
  getVersionList = () => {
    const { projectId, envID } = this.state
    reqGet('/performance/task/package/versions', {
      projectID: projectId,
      envID: envID
    }).then(res => {
      if (res.code === 0) {
        let id = ''
        if (this.state.versionID) {
          id = this.state.versionID
        } else {
          id = res.data && res.data[0] && res.data[0].code
        }
        this.setState({
          versionList: res.data,
          versionID: id
        })
      } else {
        message.error(res.msg)
      }
    })
  }

  /**
   * @desc 修改版本
   * @param versionID
   */
  changeVersion = (versionID) => {
    this.setState({
      versionID
    }, () => {})
    this.getList()
  }

  /**
   * @desc 获取状态列表
   */
  getStatusList = () => {
    reqGet('performance/task/statuslist', {
      projectID: this.props.projectId,
    }).then(res => {
      if (res.code === 0) {
        let id = ''
        if (this.state.status) {
          id = this.state.status
        } else {
          id = res.data && res.data[0] && res.data[0].code
        }
        this.setState({
          statusList: res.data,
          status: id,
        })
      }
    })
  }

  /**
   * @desc 切换状态
   * @param status
   */
  changeStatus = (status) => {
    this.setState({
      status
    }, () => {
      this.getList()
    })
  }

  /**
   * @desc 获取机型列表
   */
  getModalList = () => {
    reqGet('/performance/task/phones', {
      projectID: this.props.projectId,
      buildType: 1
    }).then(res => {
      if (res.code === 0) {
        let id = ''
        if (this.state.modal) {
          id = this.state.modal
        } else {
          id = res.data && res.data[0] && res.data[0].code
        }
        this.setState({
          modalList: res.data,
          modal: id
        })
      }
    })
  }

  /**
   * @desc 切换机型
   * @param modal
   */
  changeModal = (modal) => {
    this.setState({
      modal
    }, () => {
      this.getList()
    })
  }

  /**
   * @desc 获取列表
   */
  getList = () => {
    const { projectId, envID, status, versionID, branchID, modal, curPage } = this.state
    reqGet('/performance/task/list', {
      'projectID': projectId,
      'envID': envID,
      'versionLong': versionID,
      'branchName': branchID,
      'status': status,
      'phoneKey': modal,
      'buildType': 1,
      'page': curPage,
      'limit': 10
    }).then(res => {
      if (res.code === 0) {

      } else {
        Modal.info({
          title: '提示',
          content: (
            <p>{res.msg}</p>
          ),
          onOk () {
          }
        })
      }
    })
  }

  componentWillMount () {
    this.props.setTestBuildType('branch')
    this.getEnvList()
    this.getBranchList()
    this.getStatusList()
    this.getModalList()
    this.getList()
  }

  componentDidMount () {
  }

  componentWillUnmount () {
  }

  render () {
    const {
      listData,
      columns,
      pagination,
      loading,

      envID,
      envList,
      versionList,
      versionID,
      branchList,
      branchID,
      statusList,
      status,
      modalList,
      modal
    } = this.state

    const expandedRowRender = (record) => {
      console.log(record)
      const columns = [
        {
          title: 'ID',
          width: '8%',
          key: 'demandID'
        },
        {
          title: '分支',
          dataIndex: 'branch',
          key: 'branch',
          width: '20%'
        },
        {
          title: '版本',
          dataIndex: 'version',
          key: 'version',
          width: '8%'
        },
        {
          title: '环境',
          dataIndex: 'env',
          key: 'env',
          width: '10%',
        },
        {
          title: '场景',
          dataIndex: 'scene',
          key: 'scene',
          width: '8%'
        },
        {
          title: '创建人',
          dataIndex: 'creator',
          key: 'creator',
          width: '6%'
        },
        {
          title: '时间',
          dataIndex: 'time',
          key: 'time',
          width: '10%'
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: '10%'
        }, {
          title: '机型',
          dataIndex: 'type',
          key: 'type',
          width: '10%'
        },
        {
          title: '操作',
          width: '10%',
          key: 'edit',
          render: (text, record) => <div><a>查看报告</a></div>
        }
      ]
      return (
        <Table
          columns={columns}
          dataSource={record.list}
          pagination={false}
          showHeader={false}
          indentSize={0}
          rowClassName="rowClass"
          rowKey={record => record.id}
        />
      )
    }
    return (
      <div className="performance">
        <Breadcrumb className="devops-breadcrumb">
          <BreadcrumbItem><Link to="/home">首页</Link></BreadcrumbItem>
          <BreadcrumbItem><Link to="/performanceConfig">性能测试管理</Link></BreadcrumbItem>
          <BreadcrumbItem>分支测试</BreadcrumbItem>
        </Breadcrumb>
        <div className={'devops-main-controlArea'}>
          <Row>
            <Col>
              <span>环境：</span>
              <Select value={envID}
                      style={{ width: 100, marginRight: 40 }}
                      onChange={this.changeEnv}>
                {envList.length > 0 && envList.map((item, index) => {
                  return <Option value={item.code} key={index}>{item.text}</Option>
                })}
              </Select>
              <span>版本：</span>
              <Select value={versionID}
                      style={{ width: 100 }}
                      onChange={this.changeVersion}>
                {versionList.length > 0 && versionList.map((item, index) => {
                  return <Option value={item.code} key={index}>{item.text}</Option>
                })}
              </Select>
              <span style={{ paddingRight: 0, paddingLeft: 40 }}>开发分支：</span>
              <Select placeholder="开发分支"
                      style={{ width: 100 }}
                      showSearch
                      value={branchID}
                      onSearch={this.getBranchList}
                      onChange={this.changeBranch}>
                {
                  branchList.map((item) => {
                    return <Option value={item.code} key={item.code}
                    >{item.text}</Option>
                  })
                }
              </Select>
              <span style={{ paddingRight: 0, paddingLeft: 40 }}>状态：</span>
              <Select placeholder="状态"
                      style={{ width: 100 }}
                      showSearch
                      value={status}
                      onSearch={this.getStatusList}
                      onChange={this.changeStatus}>
                {
                  statusList.map((item) => {
                    return <Option value={item.code} key={item.code}>{item.text}</Option>
                  })
                }
              </Select>
              <span style={{ paddingRight: 0, paddingLeft: 40 }}>机型：</span>
              <Select placeholder="机型"
                      style={{ width: 100 }}
                      showSearch
                      value={modal}
                      onSearch={this.getModalList}
                      onChange={this.changeModal}>
                {
                  modalList.map((item) => {
                    return <Option value={item.code} key={item.code}>{item.text}</Option>
                  })
                }
              </Select>

            </Col>
          </Row>
        </div>


        <div className="devops-main-wrapper">
          <main className='performance-list-main'>
            <div role="tablist" className="ant-tabs-bar ant-tabs-top-bar">
              <div className="ant-tabs-extra-content" style={{ float: 'right', paddingRight: '35px' }}>
                <Button type="primary" onClick={this.goToAdd}>新增测试</Button>
              </div>
              <div className="ant-tabs-nav-container">
                <div className="ant-tabs-nav-wrap">
                  <div className="ant-tabs-nav-scroll">
                    <div className="ant-tabs-nav">
                      <div>
                        <div className="ant-tabs-tab" style={{ 'fontWeight': '500' }}>分支测试
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Table
              columns={columns}
              rowKey={record => record.id}
              expandedRowRender={expandedRowRender}
              dataSource={listData}
              indentSize={0}
              pagination={pagination}
              loading={loading}
              onChange={this.handleTableChange}/>
          </main>
        </div>

      </div>
    )
  }
}

function mapStateToProps (state) {
  const { project } = state
  if (project.projectId) {
    return {
      projectId: project.projectId,
      testBuildType: project.testBuildType
    }
  }

  return {
    projectId: null,
    testBuildType: null
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setTestBuildType: bindActionCreators(setTestBuildType, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PerformanceBranchTest)
