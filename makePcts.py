# CHECK IF YOU HAVE ALL 50 states, no zero values!

import pandas as pd
from stateAbbreviations import *
import datetime as dt
from io import BytesIO
from urllib.request import urlopen
from zipfile import ZipFile
import glob
import os
import shutil
import csv

# Global objects
states = list(us_state_abbrev.keys())
abbrevs = list(abbrev_us_state.keys())
today = dt.date.today()
days = []
for i in range(3,22): # Those infected between 3-21 days ago will test positive today
    day = today - dt.timedelta(days=i)
    days.append(day.strftime("%Y-%m-%d"))

statePopsFile = pd.read_csv("./Data/statePops.csv", header=None)
statePops = {}
for i, row in statePopsFile.iterrows():
    statePops[row[0]] = row[1]

def getMIT():
    twoDaysAgo = (today - dt.timedelta(days=2)).strftime("%Y-%m-%d")
    MIT_url_head = 'https://raw.githubusercontent.com/youyanggu/covid19_projections/master/projections/'
    result = pd.DataFrame(columns=["location_name", "lower_prob", "mean_prob", "upper_prob"])
    positivesLower = 0
    positivesMean = 0
    positivesUpper = 0
    pop = 0
    for abbrev in abbrevs:
        state = abbrev_us_state[abbrev]
        MIT_url = MIT_url_head + twoDaysAgo + '/US_' + abbrev + '.csv'
        df = pd.read_csv(MIT_url)

        after_start_date = df["date"] == twoDaysAgo
        df = df.loc[after_start_date]

        currentPositivesLower = df['predicted_current_infected_lower'].sum()
        positivesLower += currentPositivesLower
        currentPositivesMean = df['predicted_current_infected_mean'].sum()
        positivesMean += currentPositivesMean
        currentPositivesUpper = df['predicted_current_infected_upper'].sum()
        positivesUpper += currentPositivesUpper

        pop += statePops[state]
        probPositiveLower = currentPositivesLower / statePops[state]
        probPositiveMean = currentPositivesMean / statePops[state]
        probPositiveUpper = currentPositivesUpper / statePops[state]

        result.loc[0 if pd.isnull(result.index.max()) else result.index.max() + 1] = [state, probPositiveLower, probPositiveMean, probPositiveUpper]

    intlProbLower = positivesLower/pop
    intlProbMean = positivesMean/pop
    intlProbUpper = positivesUpper/pop
    result.loc[result.index.max() + 1] = ['International', intlProbLower, intlProbMean, intlProbUpper]
    result.to_csv("./public/MIT_pcts.csv", index=False)
    return

def getIHME():
    # Download IHME data
    IHME_url = 'https://ihmecovid19storage.blob.core.windows.net/latest/ihme-covid19.zip'
    IHME_fileName = "/Reference_hospitalization_all_locs.csv"
    with urlopen(IHME_url) as zipresp:
        with ZipFile(BytesIO(zipresp.read())) as zfile:
            zfile.extractall("./Data/")

    filesList = glob.glob('./Data/*')
    latestDirectory = max(filesList, key=os.path.getctime)
    filePath = latestDirectory + IHME_fileName
    if os.path.exists("./Data" + IHME_fileName):
        os.remove("./Data" + IHME_fileName)
    shutil.move(filePath, "./Data/")
    shutil.rmtree(latestDirectory)

    df = pd.read_csv("./Data" + IHME_fileName)

    # Clean IHME Data
    start_date = "2020-06-01"
    in_US = df["location_name"].isin(states)
    after_start_date = df["date"] >= start_date
    in_US_and_recent = in_US & after_start_date
    df = df.loc[in_US_and_recent]

    #  Make final CSV
    result = pd.DataFrame(columns=["location_name", "lower_prob", "mean_prob", "upper_prob"])
    positivesLower = 0
    positivesMean = 0
    positivesUpper = 0
    pop = 0
    for state in states:
        ourState = df[df['location_name'] == state]
        data = ourState[ourState['date'] == days[0]]
        for i in range(1, len(days)):
            data = pd.concat([data, ourState[ourState['date'] == days[i]]], axis=0)
        pastInfections = data
        currentPositivesLower = pastInfections['est_infections_lower'].sum()
        positivesLower += currentPositivesLower
        currentPositivesMean = pastInfections['est_infections_mean'].sum()
        positivesMean += currentPositivesMean
        currentPositivesUpper = pastInfections['est_infections_upper'].sum()
        positivesUpper += currentPositivesUpper
        pop += statePops[state]

        probPositiveLower = currentPositivesLower / statePops[state]
        probPositiveMean = currentPositivesMean / statePops[state]
        probPositiveUpper = currentPositivesUpper / statePops[state]

        result.loc[0 if pd.isnull(result.index.max()) else result.index.max() + 1] = [state, probPositiveLower, probPositiveMean, probPositiveUpper]

    intlProbLower = positivesLower/pop
    intlProbMean = positivesMean/pop
    intlProbUpper = positivesUpper/pop
    result.loc[result.index.max() + 1] = ['International', intlProbLower, intlProbMean, intlProbUpper]
    result.to_csv("./public/IHME_pcts.csv", index=False)
    return

def sh(script, msg=0):
    os.system("zsh -c '%s'" % script)

if __name__=="__main__":
    try:
        getIHME()
        sh('echo "got IHME data"')
    except:
        sh('echo "error getting IHME data"')
    try:
        getMIT()
        sh('echo "got MIT data"')
    except:
        sh('echo "error getting MIT data"')
