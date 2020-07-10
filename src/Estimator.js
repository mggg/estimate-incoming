import React from 'react';

import FileInput from './fileinput';

export default class Estimator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uniStats: []
    }
  }

  fileUploaded(data) {
    this.setState({
      uniStats: data
    })
  }

  approxPositiveStudents() {
    let stats = this.state.uniStats,
        sum = 0,
        students = 0,
        lines = [];

    stats.forEach((state, i) => {
      lines.push(<tr key={i}>
        <td>{state.name}</td>
        <td>{state.positivity}</td>
        <td>{state.students}</td>
        <td>{state.positives.toFixed(2)}</td>
      </tr>)
      students += state.students * 1;
      sum += state.positives * 1;
    })

    lines.push(<tr key="total">
      <td><strong>Total</strong></td>
      <td></td>
      <td>{students}</td>
      <td>Approximately<br/>{sum.toFixed(2)}</td>
    </tr>)

    return lines;
  }

  render() {
    return <div className="container">
      <div className="row">
        <div className="col-sm-12">
          <FileInput
            onChange={this.fileUploaded.bind(this)}
            />
        </div>
        <div className="col-sm-12">
          <table className="table">
            <thead>
              <tr>
                <th>State</th>
                <th>Positive Rate</th>
                <th>Arriving Students</th>
                <th>Positives</th>
              </tr>
            </thead>
            <tbody>
              {this.approxPositiveStudents()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  }
}
