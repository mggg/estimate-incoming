import React from 'react';
import DataFrame from "dataframe-js";

import FileInput from './fileinput';

function lowerState(txt) {
  txt = txt.trim();
  if (txt.length === 2) {
      txt = ({
        al: "Alabama",
        ak: "Alaska",
        az: "Arizona",
        ar: "Arkansas",
        ca: "California",
        co: "Colorado",
        ct: "Connecticut",
        de: "Delaware",
        fl: "Florida",
        ga: "Georgia",
        hi: "Hawaii",
        id: "Idaho",
        il: "Illinois",
        in: "Indiana",
        ia: "Iowa",
        ks: "Kansas",
        ky: "Kentucky",
        la: "Louisiana",
        me: "Maine",
        mh: "Marshall Islands",
        md: "Maryland",
        ma: "Massachusetts",
        mi: "Michigan",
        mn: "Minnesota",
        ms: "Mississippi",
        mo: "Missouri",
        mt: "Montana",
        ne: "Nebraska",
        nv: "Nevada",
        nh: "New Hampshire",
        nj: "New Jersey",
        nm: "New Mexico",
        ny: "New York",
        nc: "North Carolina",
        nd: "North Dakota",
        oh: "Ohio",
        ok: "Oklahoma",
        or: "Oregon",
        pa: "Pennsylvania",
        pr: "Puerto Rico",
        ri: "Rhode Island",
        sc: "South Carolina",
        sd: "South Dakota",
        tn: "Tennessee",
        tx: "Texas",
        ut: "Utah",
        vt: "Vermont",
        va: "Virginia",
        wa: "Washington",
        dc: "District of Columbia",
        wv: "West Virginia",
        wi: "Wisconsin",
        wy: "Wyoming"
      })[txt.toLowerCase()]
  }
  return txt.toLowerCase();
}

export default class Estimator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uniStats: []
    }
  }

  fileUploaded(rows) {
    let states = rows.map((r) => {
      if (r.includes("\t")) {
        r = r.split("\t")
      } else if (r.includes(",")) {
        r = r.split(",")
      } else {
        console.error("row did not include tab or comma?")
        return null
      }
      return [lowerState(r[0]), 1 * r[1]];
    }).filter(r => !isNaN(r[1]));

    let input_df = new DataFrame(states, ["state", "students"]);
    console.log(input_df.show(3));

    //
    // [
    //   { state: "New Hampshire", students: 5, positivity: ?, positiveStudents: ? }
    // ]
    //
    // this.setState({
    //   uniStats: data
    // })
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
