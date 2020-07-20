import React from 'react';
import DataFrame from "dataframe-js";

import FileInput from './fileinput';
import LoadingGif from './loading.gif';
import {CSVLink} from "react-csv";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

const DownloadButton = props => {
  const downloadFile = () => {
    window.location.href = window.location.pathname + "/template.csv"
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
      Refresh Page
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

let ihme_df = null;
let mit_df = null;

function lowerState(txt) {
  txt = txt.trim();
  if (txt.length === 2) {
      txt = postalCodeToName[txt.toLowerCase()]
  }
  return txt.toLowerCase();
}


export default class Estimator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uniStats: [],
      loading: true,
      sortMode: 0,
      uploadError: false,
      useIHME: true,
      useSept: false
    }
  }

  componentDidMount() {
    d3.csv('./IHME_pcts.csv').then(rows => {
      rows.forEach(r => r.location_name = r.location_name.toLowerCase())
      ihme_df = new DataFrame(rows, [
        "location_name","lower_prob", "mean_prob", "upper_prob", "lower_prob_sept", "mean_prob_sept", "upper_prob_sept"]);

      d3.csv('./MIT_pcts.csv').then(rows => {
        rows.forEach(r => r.location_name = r.location_name.toLowerCase())
        mit_df = new DataFrame(rows, [
          "location_name","lower_prob", "mean_prob", "upper_prob", "lower_prob_sept", "mean_prob_sept", "upper_prob_sept"]);
        // do this 2nd
        fetch("./Tufts5470.csv").then(res => res.text()).then(data => {
            let rows = d3.csvParseRows(data);
            rows.splice(0, 1);
            this.fileUploaded(rows);
          });
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
    let states = rows.map((r) => [lowerState(r[0]), 1 * r[1]]);
    states.forEach(state => {
      let ihme_state_df = ihme_df.filter({'location_name':state[0]}),
          ihme_lower_prob = ihme_state_df.stat.mean('lower_prob'),
          ihme_mean_prob = ihme_state_df.stat.mean('mean_prob'),
          ihme_upper_prob = ihme_state_df.stat.mean('upper_prob'),
          ihme_lower_prob_sept = ihme_state_df.stat.mean('lower_prob_sept'),
          ihme_mean_prob_sept = ihme_state_df.stat.mean('mean_prob_sept'),
          ihme_upper_prob_sept = ihme_state_df.stat.mean('upper_prob_sept');
      state.push(ihme_lower_prob);
      state.push(ihme_mean_prob);
      state.push(ihme_upper_prob)
      state.push(ihme_lower_prob_sept);
      state.push(ihme_mean_prob_sept);
      state.push(ihme_upper_prob_sept);

      let mit_state_df = mit_df.filter({'location_name':state[0]}),
          mit_lower_prob = mit_state_df.stat.mean('lower_prob'),
          mit_mean_prob = mit_state_df.stat.mean('mean_prob'),
          mit_upper_prob = mit_state_df.stat.mean('upper_prob'),
          mit_lower_prob_sept = mit_state_df.stat.mean('lower_prob_sept'),
          mit_mean_prob_sept = mit_state_df.stat.mean('mean_prob_sept'),
          mit_upper_prob_sept = mit_state_df.stat.mean('upper_prob_sept');
      state.push(mit_lower_prob);
      state.push(mit_mean_prob);
      state.push(mit_upper_prob);
      state.push(mit_lower_prob_sept);
      state.push(mit_mean_prob_sept);
      state.push(mit_upper_prob_sept);
    })

    // input: [ [name, students, ihme_lower_prob, ihme_mean_prob [idx=3], ihme_upper_prob, ihme_lower_prob_sept, ihme_mean_prob_sept [idx=6], ihme_upper_prob_sept, mit_lower_prob, mit_mean_prob [idx=9], mit_upper_prob, mit_lower_prob_sept, mit_mean_prob_sept [idx=12], mit_upper_prob_sept] ]


    this.setState({
      uniStats: states,
      uploadError: false,
      loading: false
    })

  }

  sort(sortMode) {
    this.setState({ sortMode: sortMode })
  }

  approxPositiveStudents(j) {
    let states = this.state.uniStats,
        sum = 0,
        lowerSum = 0,
        upperSum = 0,
        allStudents = 0,
        estStudents = 0,
        matchedStates = 0,
        lines = [];

    // default sort is A-Z
    if (this.state.sortMode === 1) {
      // sort by positivity
      states = states.sort((a, b) => b[j] - a[j])
    } else if (this.state.sortMode === 2) {
      states = states.sort((a, b) => b[j] * b[1] - a[j] * a[1])
    } else if (this.state.sortMode === 0) {
      states = states.sort()
    }

    lines.push(
      <tr key="header">
          <th>State</th>
          <th>Estimated Positive Rate</th>
          <th>Arriving Students</th>
          <th>Estimated Positives</th>
        </tr>);

    states.forEach((state, i) => {
      lines.push(<tr key={i}>
        <td>{state[0]}</td>
        <td>{(state[j]*100).toFixed(2)}%</td>
        <td>{state[1].toLocaleString()}</td>
        <td>{(state[1] * state[j]).toFixed(2)}</td>
      </tr>)
      allStudents += state[1] * 1;
      if (!isNaN(state[j])) {
        estStudents += state[1] * 1;
        sum += state[1] * state[j];
        lowerSum += state[1] * state[j-1];
        upperSum += state[1] * state[j+1];
        matchedStates++;
      }
    })

    if (allStudents) {
      lines.unshift(
        <thead>
        <tr key="total" id="total">
        <td colSpan="2">
          <strong><h3>Total</h3></strong>
          File included {matchedStates}/53 regions<br/>
          (50 U.S. States + PR + D.C. + International)
        </td>
        <td>
          <strong><h3>{estStudents.toLocaleString()}</h3></strong>
          Matched {Math.round(estStudents/allStudents*100)}% of students
        </td>
        <td><strong><h3>{sum.toFixed(2)}</h3>[{lowerSum.toFixed(2)}, {upperSum.toFixed(2)}]</strong><br/>Est. COVID+ {this.state.useSept
          ? "9/1"
          : "today"} {this.state.useIHME ? <i>(IHME)</i> : <i>(YYG)</i>}
        <br/>(95% confidence interval)</td>
      </tr>
      <tr>
        <td colSpan="4">
          <button className="btn btn-info" onClick={e => this.sort(0)}>Sort A->Z</button>
          <button className="btn btn-info" onClick={e => this.sort(1)}>Sort by State %</button>
          <button className="btn btn-info" onClick={e => this.sort(2)}>Sort by Positives</button>
        </td>
      </tr>
      </thead>)
    }
    // console.log(this.state.uniStats);
    return lines;
  }

  format() {
    let ret = [['state', 'num_students', 'ihme_lower_prob', 'ihme_mean_prob', 'ihme_upper_prob', 'ihme_lower_prob_sept', 'ihme_mean_prob_sept', 'ihme_upper_prob_sept', 'yyg_lower_prob', 'yyg_mean_prob', 'yyg_upper_prob', 'yyg_lower_prob_sept', 'yyg_mean_prob_sept', 'yyg_upper_prob_sept']];
    let stats = this.state.uniStats;
    stats.forEach(row => {
      ret.push(row);
    });
    console.log(ret);
    return ret;
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
              <strong>This calculator is intended to help university leadership estimate how many students will immediately test positive for COVID-19 as they arrive on campus in the Fall of 2020.</strong><br/><br/>
              <strong>How to use the calculator:</strong>&nbsp;
              We have provided a template CSV that contains rows for 50 states, plus Puerto Rico (PR), Washington, D.C. (DC), and international students (international). Before uploading, be sure that the first row has precisely two headers — 'state' and 'student'. After inputting your data, you can see the total estimated number of COVID-19 positive students today, accompanied by a 95% confidence interval and a state-by-state breakdown below. By default, the calculator is populated with partial data from Tufts University.
            </p>
          </section>
        </div>

        <hr id="separator"/>
        <h2>Input your states of origin data</h2><br/>
        <div className="row">
          <div className="col-sm-6">
            <h3>Create CSV</h3>
            <DownloadButton /><br/>
            It should have this raw format...<br/>
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
            After editing the template, upload or drag and drop it onto this page. The calculator works locally in your browser and your data is not uploaded, so it remains private.<br/>
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
              <p>Your file was formatted incorrectly. Please check to make sure the top row of the file has two cells: 'state' and 'students', your left column only contain state abbrevations (capitalized) and perhaps 'international', and your right column contains only numbers. And remember to save it as a .CSV file! If you are still having trouble, feel free to email <a href="mailto:gabe.schoenbach@gmail.com">gabe.schoenbach@gmail.com</a> for help.</p>
              <RefreshButton />
            </div>
          : this.state.loading
            ? <div>
                <img src={LoadingGif} alt="Loading spinner"/>
                <p>If the spinner doesn't disappear within 5s, please refresh the page.</p>
                <RefreshButton />
              </div>
            : <div className="row">
                <div className="offset-4">
                  <DropdownButton id="dropdown" title={this.state.useIHME ? "Using IHME Data" : "Using YYG Data"}>
                    <Dropdown.Item onClick={() => this.setState({
                      useIHME: true
                    })}>
                      Use IHME Data
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => this.setState({
                      useIHME: false
                    })}>
                      Use YYG Data
                    </Dropdown.Item>
                  </DropdownButton>
                </div>
                <div>
                  <DropdownButton id="dropdown" class='floated' title={this.state.useSept ? "Estimate 9/1" : "Estimate today"}>
                    <Dropdown.Item onClick={() => this.setState({
                      useSept: false
                    })}>
                      Calculate today's estimate
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => this.setState({
                      useSept: true
                    })}>
                      Calculate September estimate
                    </Dropdown.Item>
                  </DropdownButton>
                </div>
            </div>}
        </div>

        <div className="row">
          <div className="col-sm-12">
            {this.state.uploadError
            ? <p/>
            : this.state.loading
              ? <p/>
              : <table className="table">
                {
                  (() => {
                    if (this.state.useIHME && this.state.useSept) {
                      // console.log(0);
                      return this.approxPositiveStudents(6)
                    };
                    if (this.state.useIHME && (!this.state.useSept)) {
                      // console.log(1);
                      return this.approxPositiveStudents(3)
                    };
                    if ((!this.state.useIHME) && this.state.useSept) {
                      // console.log(2);
                      return this.approxPositiveStudents(12)
                    };
                    if ((!this.state.useIHME) && (!this.state.useSept)) {
                      // console.log(3);
                      return this.approxPositiveStudents(9)
                    };
                  })()
                }
                </table>
              }
          </div>
        </div>
      </div>
      <div>
        <CSVLink data={this.format()}
                 className="btn btn-info"
                 filename="estimates.csv">
          Download CSV
        </CSVLink>
      </div>
      <hr id="separator"/>
      <section className="qSection">
        <h2>About the data</h2>
        <p style={{textAlign: 'left', padding: '10px'}}>
          We use two different models: University of Washington's <a href="http://www.healthdata.org/covid/data-downloads" target="_blank">IHME</a> and Youyang Gu's <a href="https://covid19-projections.com/" target="_blank">COVID-19 projections</a>, both of which estimate the true number of active infections in each state today. Read more about each model's assumptions  <a href="http://www.healthdata.org/covid/faqs" target="_blank">here</a> (IHME) and  <a href="https://covid19-projections.com/about/#about-the-model" target="_blank">here</a> (YYG). Dividing the number of active infections by a state's population gives us a rough estimate of the COVID-19 positivity rate statewide, which we can then multiply by the number of students arriving from that state to find an expected number of COVID-19 positive students. Our intention is to help universities understand how many isolation rooms are necessary at the start of the semester. This calculator is a project of the MGGG Redistricting Lab
          (<a href="https://mggg.org" target="_blank">mggg.org</a>)
          at Tisch College of Tufts University.  For information, contact&nbsp;
          <a href="mailto:Moon.Duchin@tufts.edu">Moon.Duchin@tufts.edu</a>.
        </p>
      </section>
    </div>
  }
}
