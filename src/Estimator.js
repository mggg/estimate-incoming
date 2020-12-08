import React from 'react';
import DataFrame from "dataframe-js";

import FileInput from './fileinput';
import LoadingGif from './loading.gif';
import {CSVLink} from "react-csv";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import ReactDOM from 'react-dom';

const DownloadButton = props => {
  const downloadFile = () => {
    window.location.href = "./template.csv"
  }
  return (
            <button id="download" className="btn btn-info" onClick={downloadFile}>
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
let nyt_df = null;
var modelNames = ["IHME", "YYG", "NYT"];

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
    // models: 0 = IHME, 1 = YYG, 2 = NYT
    this.state = {
      uniStats: [],
      loading: true,
      sortMode: 0,
      uploadError: false,
      useIHME: true, // this is unused / redundant ;)
      model: 0,
      useJan: false,
      exportClicked: false
    }
  }

  componentDidMount() {
    d3.csv('/estimate-incoming/IHME_pcts.csv').then(rows => {
      rows.forEach(r => r.location_name = r.location_name.toLowerCase())
      ihme_df = new DataFrame(rows, [
        "location_name","lower_prob", "mean_prob", "upper_prob", "lower_prob_jan", "mean_prob_jan", "upper_prob_jan"]);

      d3.csv('/estimate-incoming/MIT_pcts_OLD.csv').then(rows => {
        {};
        // rows.forEach(r => r.location_name = r.location_name.toLowerCase())
        // mit_df = new DataFrame(rows, [
        //   "location_name","lower_prob", "mean_prob", "upper_prob", "lower_prob_jan", "mean_prob_sept", "upper_prob_sept"]);

        d3.csv('/estimate-incoming/NYT_pcts.csv').then(rows => {
          rows.forEach(r => r.location_name = r.location_name.toLowerCase())
          nyt_df = new DataFrame(rows, [
            "location_name","lower_prob", "mean_prob", "upper_prob"]);
          // do this next
          fetch("/estimate-incoming/Tufts5470.csv").then(res => res.text()).then(data => {
              let rows = d3.csvParseRows(data);
              rows.splice(0, 1);
              this.fileUploaded(rows);
              console.log("hi gabey")
              console.log(ihme_df)
          });
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
          ihme_lower_prob_jan = ihme_state_df.stat.mean('lower_prob_jan'),
          ihme_mean_prob_jan = ihme_state_df.stat.mean('mean_prob_jan'),
          ihme_upper_prob_jan = ihme_state_df.stat.mean('upper_prob_jan');
      state.push(ihme_lower_prob);
      state.push(ihme_mean_prob);
      state.push(ihme_upper_prob)
      state.push(ihme_lower_prob_jan);
      state.push(ihme_mean_prob_jan);
      state.push(ihme_upper_prob_jan);

      // let mit_state_df = mit_df.filter({'location_name':state[0]}),
      //     mit_lower_prob = mit_state_df.stat.mean('lower_prob'),
      //     mit_mean_prob = mit_state_df.stat.mean('mean_prob'),
      //     mit_upper_prob = mit_state_df.stat.mean('upper_prob'),
      //     mit_lower_prob_sept = mit_state_df.stat.mean('lower_prob_sept'),
      //     mit_mean_prob_sept = mit_state_df.stat.mean('mean_prob_sept'),
      //     mit_upper_prob_sept = mit_state_df.stat.mean('upper_prob_sept');
      // state.push(mit_lower_prob);
      // state.push(mit_mean_prob);
      // state.push(mit_upper_prob);
      // state.push(mit_lower_prob_sept);
      // state.push(mit_mean_prob_sept);
      // state.push(mit_upper_prob_sept);

      let nyt_state_df = nyt_df.filter({'location_name':state[0]}),
          nyt_lower_prob = nyt_state_df.stat.mean('lower_prob'),
          nyt_mean_prob = nyt_state_df.stat.mean('mean_prob'),
          nyt_upper_prob = nyt_state_df.stat.mean('upper_prob')
      // console.log("hi gabey")
      // console.log(nyt_mean_prob)
      state.push(nyt_lower_prob);
      state.push(nyt_mean_prob);
      state.push(nyt_upper_prob);
    })

    // input: [ [name, students, ihme_lower_prob, ihme_mean_prob [idx=3], ihme_upper_prob, ihme_lower_prob_jan, ihme_mean_prob_jan [idx=6], ihme_upper_prob_jan, mit_lower_prob, mit_mean_prob [idx=9], mit_upper_prob, mit_lower_prob_jan, mit_mean_prob_jan [idx=12], mit_upper_prob_jan, nyt_lower_prob, nyt_mean_prob [idx=15], nyt_upper_prop] ]


    this.setState({
      uniStats: states,
      uploadError: false,
      loading: false
    })

    let element = document.querySelector('#sorts');
    ReactDOM.findDOMNode(element).style.borderStyle = 'fill';
    ReactDOM.findDOMNode(element).style.borderColor = 'black';

  }

  sort(sortMode) {
    this.setState({ sortMode: sortMode });
    let elements = document.querySelectorAll('#sorts');
    var buttons = [0,1,2];
    buttons.forEach(n => {
      if (n === sortMode) {
        ReactDOM.findDOMNode(elements[sortMode]).style.borderStyle = 'fill';
        ReactDOM.findDOMNode(elements[sortMode]).style.borderColor = 'black';
        ReactDOM.findDOMNode(elements[sortMode]).style.backgroundColor = '#23b4c9';
      } else {
        ReactDOM.findDOMNode(elements[n]).style.borderStyle = 'fill';
        ReactDOM.findDOMNode(elements[n]).style.borderColor = 'white';
        ReactDOM.findDOMNode(elements[n]).style.backgroundColor = '#23b4c9';
      };
    });
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
        <td>
          <strong><h2>Total</h2></strong>
          File included {matchedStates}/53 regions<br/>
          (50 U.S. States + PR + D.C. + International)
        </td>
        <td>
          <strong><h2>{estStudents.toLocaleString()}</h2></strong>
          Matched {Math.round(estStudents/allStudents*100)}% of students
        </td>
        <td colSpan="2"><strong><h2>{sum.toFixed(2)}</h2>[{lowerSum.toFixed(2)}, {upperSum.toFixed(2)}]</strong><br/>Estimated COVID-19+ students {this.state.useJan
          ? "on 1/15"
          : "today"} {"(" + modelNames[this.state.model] + ")"}
        <br/>{((this.state.model === 0) | (this.state.model === 1))
          ? "[95% confidence interval]"
          : "[Lower bound, Upper bound]"
        }</td>
      </tr>
      <tr>
        <td colSpan="4">
          <button id="sorts" className="btn btn-info" onClick={e => this.sort(0)}>Sort A->Z</button>
          <button id="sorts" className="btn btn-info" onClick={e => this.sort(1)}>Sort by State %</button>
          <button id="sorts" className="btn btn-info" onClick={e => this.sort(2)}>Sort by Positives</button>
        </td>
      </tr>
      </thead>)
    }
    // console.log(this.state.uniStats);
    return lines;
  }

  formatTableToCSV() {
    let ret = [['state', 'num_students', 'ihme_lower_rate', 'ihme_mean_rate', 'ihme_upper_rate', 'ihme_lower_rate_jan', 'ihme_mean_rate_jan', 'ihme_upper_rate_jan', 'nyt_lower_rate', 'nyt_mean_rate', 'nyt_upper_rate']];
    let stats = this.state.uniStats;
    stats.forEach(row => {
      ret.push(row);
    });
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
              <strong>This calculator is intended to help university leadership estimate how many students will immediately test positive for COVID-19 as they return to campus in January 2021.</strong><br/><br/>
              This is a web tool to interface with two COVID tracking models that estimate how many people in each state become infected with COVID-19 each day. (See below for model explanations)<br/><br/>
              <strong>How to use the calculator:</strong> We have provided a template CSV that contains rows for 50 states, plus Puerto Rico (PR), Washington, D.C. (DC), and international students (international). Before uploading, be sure that the first row has precisely two headers — 'state' and 'student'. After inputting your data, you can see the total estimated number of students who would test COVID-19 positive <i>today</i> or on <i>Jan. 15</i>, according to each model.  We also show a confidence interval and a state-by-state breakdown according to the same models. By default, the calculator is populated with partial data from Tufts University.<br/><br/>We emphasize that this estimator is for PCR test positivity, rather than infection or symptoms.
            </p>
          </section>
        </div>

        <hr id="separator"/>
        <h2>Input your states-of-origin data</h2><br/>
        <div className="row">
          <div className="col-sm-6">
            <h3>Create CSV</h3>
            <DownloadButton/><br/>
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
            After editing the template, upload or drag and drop it onto this page. The calculator works locally in your browser and your data is not uploaded, so it remains private. Once the data have loaded, scroll to the bottom of the page to export the data as a CSV file.<br/><br/>
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
              <p>Your file was formatted incorrectly. Please check to make sure the top row of the file has two cells: 'state' and 'students', your left column only contain state abbrevations (capitalized) and perhaps 'international', and your right column contains only numbers. And remember to save it as a .CSV file! If you are still having trouble, feel free to email <a href="mailto:gabe.schoenbach@mggg.org">gabe.schoenbach@mggg.org</a> for help.</p>
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
                  <DropdownButton id="dropdown" title={this.state.useJan ? "Jan. 15 Estimate" : "Today's Estimate"}>
                    <Dropdown.Item onClick={() => this.setState({
                      useJan: false
                    })}>
                      Today's Estimate
                    </Dropdown.Item>
                    <Dropdown.Item disabled={this.state.model === 2} onClick={() => this.setState({
                      useJan: true
                    })}>
                      Jan. 15 Estimate
                    </Dropdown.Item>
                  </DropdownButton>
                </div>
                <div>
                    <DropdownButton id="dropdown" title={"Using " + modelNames[this.state.model] + " Model"}>
                      <Dropdown.Item onClick={() => this.setState({
                        model: 0
                      })}>
                        Use IHME Model
                      </Dropdown.Item>

                      <Dropdown.Item disabled={this.state.useJan === true} onClick={() => this.setState({
                        model: 2
                      })}>
                        Use NYT Model
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
                    // subtracting 6 from the model states!
                    if ((this.state.model === 0) && this.state.useJan) {
                      // console.log(0);
                      return this.approxPositiveStudents(6)
                    };
                    if ((this.state.model === 0) && (!this.state.useJan)) {
                      // console.log(1);
                      return this.approxPositiveStudents(3)
                    };
                    if ((this.state.model === 1) && this.state.useJan) {
                      // console.log(2);
                      return this.approxPositiveStudents(12)
                    };
                    if ((this.state.model === 1) && (!this.state.useJan)) {
                      // console.log(3);
                      return this.approxPositiveStudents(9)
                    };
                    if (this.state.model === 2) {
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
      {this.state.exportClicked
        ? <div>
            <p className="qSection" style={{textAlign:"left", padding: '10px'}}>
              You should now have 'stateCovidProbabilities.csv' in your Downloads folder. It contains a row for every state for which you submitted states-of-origin data. There is a column for the number of students incoming from that state. The rest of the columns provide the estimated proportion of that state that is COVID+ using each model. The IHME model provides an estimate for today as well as a prediction for Jan. 15, and both models provide lower and upper bounds for each proportion. To find the number of students incoming from a state that are expected to test positive, multiply the number of students column by the corresponding state proportion column.
            </p>
          </div>
        : <div>
          <CSVLink data={this.formatTableToCSV()}
                   className="btn btn-info"
                   filename="stateCovidProbabilities.csv"
                   onClick={() => {
                    this.setState({
                     exportClicked: true
                   })}
            }>
            Export CSV
          </CSVLink>
        </div>}
      <hr id="separator"/>
      <section className="qSection">
        <p>Page last updated 11:38am ET, 12/08/2020</p>
        <p style={{textAlign: 'left', padding: '10px'}}>
         University of Washington's <a href="http://www.healthdata.org/covid/data-downloads" target="_blank">IHME</a> model estimates the true number of active infections in each state today with a methodology that centers on the death count rather than the case count. IHME projects the death rate out a few weeks into the future and works from there to estimate how many people are infected each day, taking the age structure of the state into account. The <a href="https://www.nytimes.com/interactive/2020/us/coronavirus-us-cases.html" target="_blank">New York Times</a> (NYT) option, meanwhile, is based on the case count (the number of positive tests). The NYT <a href="https://www.nytimes.com/interactive/2020/07/31/us/coronavirus-school-reopening-risk.html?smid=nytcore-ios-share" target="_blank">collaborated with</a> researchers in the Meyers Lab at UT Austin who used an in-depth study of Texas to suggest multiplying the number of cases by 5 to estimate the true active infections, with multipliers of 3 and 10 for lower and upper bounds, respectively. The NYT model updates daily, while the IHME model is generally updated weekly. Read more about each model's assumptions <a href="http://www.healthdata.org/covid/faqs" target="_blank">here</a> (IHME) and <a href="https://sites.cns.utexas.edu/sites/default/files/cid/files/covid_healthcare_projections_texas_tsas_august_2020.pdf?m=1596321322" target="_blank">here</a> (NYT/UT).<br/><br/>
         Finally, we use <a href="https://www.medrxiv.org/content/10.1101/2020.07.13.20152793v2" target="_blank">supplemental data</a> on the PCR test positivity (see Figure 4 of the linked PDF) with a 5-day lag to estimate that a positive test will occur on day 5-21 after initial infection, with a linearly diminishing probability each day. So our positivity rate is a (discounted) sum of the new infections from 5-21 days prior.<br/><br/>
          This calculator is a project of the MGGG Redistricting Lab
          (<a href="https://mggg.org" target="_blank">mggg.org</a>)
          at Tisch College of Tufts University.  For information, contact&nbsp;
          <a href="mailto:Moon.Duchin@tufts.edu">Moon.Duchin@tufts.edu</a>.
        </p>
      </section>
    </div>
  }
}
