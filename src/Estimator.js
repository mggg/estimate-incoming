import React from 'react';
import DataFrame from "dataframe-js";

import FileInput from './fileinput';
import LoadingGif from './loading.gif';
// import unzipper from './unzipper';
// import http from 'http';

const DownloadButton = props => {
  const downloadFile = () => {
    window.location.href = "/estimate-incoming/template.csv"
  }
  return (
            <button className="btn btn-info" onClick={downloadFile}>
              Download Template
            </button>
  )
}

const RefreshButton = props => {
  return (
    <button className='btn btn-info'
            onClick={() => window.location.reload()}>
      Start Over
    </button>
  )
}

const d3 = require("d3");
const postalCodeToName = {
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
};

let df = null;

function lowerState(txt) {
  txt = txt.trim();
  if (txt.length === 2) {
      txt = postalCodeToName[txt.toLowerCase()]
  }
  return txt.toLowerCase();
}

function parsedDate(date) {
  let dd = String(date.getDate()).padStart(2, '0'),
      mm = String(date.getMonth() + 1).padStart(2, '0'),
      yyyy = date.getFullYear(),
      str = yyyy + '-' + mm + '-' + dd;
  return str;
};

export default class Estimator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uniStats: [],
      loading: true,
      sortMode: 0,
      uploadError: false
    }
  }

  componentDidMount() {
    d3.csv('/estimate-incoming/latestData.csv').then(rows => {
      // console.log(rows);
      rows.forEach(r => r.location_name = r.location_name.toLowerCase())
      df = new DataFrame(rows, [
        "date_reported","location_name", "mean_infections", "location_population"]);
      // infections_data.show(3);

      fetch("/estimate-incoming/students.csv").then(res => res.text()).then(data => {
        let rows = d3.csvParseRows(data);
        rows.splice(0, 1);
        this.fileUploaded(rows);
      });
    });
  }

  startLoading() {
    this.setState({ loading: true })
  }

  fileUploaded(rows) {
    if (isNaN(rows[0][1] * 1) || rows[0].length !== 2) {
      this.setState({
        uploadError: true,
      })
      return;
    }
    let states = rows.map((r) => [lowerState(r[0]), 1 * r[1]]),
        days = [];
    for (var i = 3; i<22; i++) {
      var date = new Date();
      date.setDate(date.getDate() - i);
      let dateString = parsedDate(date);
      days.push(dateString);
    }

    // input: [ [name, students] ]

    let totalPop = 0;
    let totalPositives = 0;

    states.forEach(state => {
      if (state[0] === 'international') {
        return
      } else {
        let ourState = df.filter({'location_name':state[0]});
        let popState = ourState.stat.mean('location_population');
        if (!isNaN(popState)) {
          totalPop += popState;
        }
        let data = ourState.filter({'date_reported':days[0]});
        for (var i = 1; i < days.length; i++) {
          data = data.union(ourState.filter({'date_reported':days[i]}))
        }
        let pastInfections = data;
        let currentPositives = pastInfections.stat.sum('mean_infections');
        totalPositives += currentPositives;
        let probPositive = currentPositives / popState;
        state.push(probPositive);
      }
    });

    states.forEach(state => {
      if (state[0] === 'international') {
        state.push(totalPositives/totalPop);
      }
    })

    // output: [[ name, students, fraction_prob_positive ]]

    this.setState({
      uniStats: states,
      uploadError: false,
      loading: false
    })
  }

  sort(sortMode) {
    this.setState({ sortMode: sortMode })
  }

  approxPositiveStudents() {
    let states = this.state.uniStats,
        sum = 0,
        allStudents = 0,
        estStudents = 0,
        matchedStates = 0,
        lines = [];

    // default sort is A-Z
    if (this.state.sortMode === 1) {
      // sort by positivity
      states = states.sort((a, b) => b[2] - a[2])
    } else if (this.state.sortMode === 2) {
      states = states.sort((a, b) => b[2] * b[1] - a[2] * a[1])
    } else if (this.state.sortMode === 0) {
      states = states.sort()
    }

    states.forEach((state, i) => {
      lines.push(<tr key={i}>
        <td>{state[0]}</td>
        <td>{(state[2]*100).toFixed(2)}%</td>
        <td>{state[1].toLocaleString()}</td>
        <td>{(state[1] * state[2]).toFixed(2)}</td>
      </tr>)
      allStudents += state[1] * 1;
      if (!isNaN(state[2])) {
        estStudents += state[1] * 1;
        sum += state[1] * state[2];
        matchedStates++;
      }
    })

    if (allStudents) {
      lines.push(<tr key="total" id="total">
        <td colSpan="2">
          <strong>Total</strong>
          <br/>
          File included {matchedStates}/53 regions
        </td>
        <td>
          <strong>{estStudents.toLocaleString()}</strong> <br/>
          Matched {Math.round(estStudents/allStudents*100)}% of students
        </td>
        <td><strong>{sum.toFixed(2)}</strong><br/>Estimated COVID-positive</td>
      </tr>)
    }

    return lines;
  }

  render() {
    return <div className="container">
      <div className="col-sm-12">
        <div style={{textAlign:"center"}}>
          <nav className="navbar navbar-dark bg-primary">
            <h2>Estimate Incoming Cases</h2>
          </nav>
          <section className="qSection">
            <p style={{textAlign: 'left', padding: '10px'}}>
              <strong>This is a calculator to help university leadership estimate how many students will immediately test positive for COVID-19 as they arrive on campus in the Fall of 2020.</strong> We use data from Dr. Abraham Flaxman and the <a href="http://www.healthdata.org/covid/data-downloads" target="_blank">IHME</a> that estimates the number of daily infections in each state, along with university-specific data on where students are coming from. Our intention is to help universities understand how many isolation rooms are necessary at the start of the semester. This calculator is a project of the MGGG Redistricting Lab
              (<a href="https://mggg.org" target="_blank">mggg.org</a>)
              at Tisch College of Tufts University.  For information, contact&nbsp;
              <a href="mailto:Moon.Duchin@tufts.edu">Moon.Duchin@tufts.edu</a>.
            </p>
            <p style={{textAlign: 'left', padding: '10px'}}>
              <strong>How to use this calculator:</strong>&nbsp;
              Upload a CSV file (formatted as below) that contains the number of students from each state, and the calculator will handle the rest.
            </p>
          </section>
        </div>

        <hr id="separator"/>

        <div className="row">
          <div className="col-sm-6">
            <h3>Create CSV</h3>
            <DownloadButton /><br/>
            It should have this format:<br/>
              <code>
              state,students<br/>
              international,20<br/>
              AK,2<br/>
              AL,4<br/>
              ...
              </code>
          </div>
          <div className="col-sm-6">
            <h3>Process File</h3>
            After editing the template, upload or drag and drop it onto this page.<br/>
            It is read locally and not uploaded.<br/>
            <div className="col-sm-6 offset-3" style={{border:"1px solid #ccc", padding: 6}}>
              <FileInput
                onChange={this.fileUploaded.bind(this)}
                startLoading={this.startLoading.bind(this)}
                />
            </div>
          </div>
        </div>
        <hr/>
        <div className="col-sm-12">
          {this.state.uploadError
          ? <div>
              <p>Your file was formatted incorrectly.</p>
              <RefreshButton />
            </div>
          : this.state.loading
            ? <img src={LoadingGif} alt="Loading spinner"/>
            : <div>
              <button className="btn btn-info" onClick={e => this.sort(0)}>Sort A->Z</button>
              <button className="btn btn-info" onClick={e => this.sort(1)}>Sort by State %</button>
              <button className="btn btn-info" onClick={e => this.sort(2)}>Sort by Positives</button>
            </div>}
        </div>

        <div className="row">
          <div className="col-sm-12">
            {this.state.uploadError
            ? <p/>
            : this.state.loading
              ? <p/>
              : <table className="table">
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Estimated Positive Rate</th>
                      <th>Arriving Students</th>
                      <th>Estimated Positives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.approxPositiveStudents()}
                  </tbody>
                </table>
              }
          </div>
        </div>
      </div>
    </div>
  }
}
