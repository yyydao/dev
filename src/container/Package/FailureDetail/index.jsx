import React, {Component} from 'react'
import {Input, Divider, Button, message} from 'antd';
import {packageDetail, failureRecommit} from '@/api/package/package'
import qs from 'qs'
import './index.scss'

const {TextArea} = Input;

class FailureDetail extends Component {

  constructor() {
    super();
    this.state = {
      detailData: {},
      changeLog: '',
      taskId: ''
    }
  }

  async componentWillMount() {
    let parsed = qs.parse(this.props.location.search, {ignoreQueryPrefix: true});
    let buildId = parsed.buildId;
    if (buildId) {
      let response = await packageDetail({buildId});
      if (response.data.code === '0' || response.data.code === 0) {
        this.setState({
          detailData: response.data.data,
          platformName: parsed.platformName,
          envName: parsed.envName,
          taskId: parsed.taskId,
          changeLog: response.data.data.rebuildContent
        })
      }
    }
  }


  // 回归内容修改
  handleChange(e) {
    this.setState({
      changeLog: e.target.value
    })
  }

// 失败包重新提交
  async failureRecommitFun() {
    let {detailData, taskId} = this.state;
    let response = await failureRecommit({taskId, changeLog: detailData});
    if (response.data.code === '0' || response.data.code === 0) {
      message.success('成功');
    }
  }

  render() {
    let {detailData, platformName, envName, changeLog} = this.state;
    return (
      <div className="failure-detail-container">
        <Divider orientation="left" className="title">{platformName}-{envName}</Divider>
        <div>
          <span className="build-time">构建日期：{detailData.buildTime}</span>
          <ul className="info-container" style={{listStyle: 'none'}}>
            <li>提测人：{detailData.taskMaster}</li>
            <li>提测分支：{detailData.codeBranch}</li>
            <li> 提测详情：<a href={detailData.submitDetails}>{detailData.submitDetails}</a></li>
            <li>
              <h4>提测概要</h4>
              <TextArea autosize={{minRows: 4, maxRows: 10}} value={detailData.submitContent} style={{width: '95%'}}
                        disabled/>
            </li>
            <li>
              <h4>回归内容</h4>
              <TextArea
                autosize={{minRows: 4, maxRows: 10}}
                value={changeLog}
                style={{width: '95%'}}
                onChange={(e) => this.handleChange(e)}
              />
            </li>
          </ul>
        </div>
        <footer>
          <Button type="primary" onClick={this.failureRecommitFun.bind(this)}>重新提交
          </Button>
        </footer>
      </div>
    )
  }
}

export default FailureDetail;