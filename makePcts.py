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

def probPCRPos(i):
    return -0.0222*i + 1.0667

def getMIT():
    twoDaysAgo = (today - dt.timedelta(days=2)).strftime("%Y-%m-%d")
    sept = dt.datetime(2020,9,1)
    dates = [today, sept]
    MIT_url_head = 'https://raw.githubusercontent.com/youyanggu/covid19_projections/master/projections/'
    result = pd.DataFrame(columns=["location_name", "lower_prob", "mean_prob", "upper_prob"])
    resultSept = pd.DataFrame(columns=["lower_prob_sept", "mean_prob_sept", "upper_prob_sept"])

    for i, date in enumerate(dates):
        positivesLower = 0
        positivesMean = 0
        positivesUpper = 0
        pop = 0
        for abbrev in abbrevs:
            state = abbrev_us_state[abbrev]
            MIT_url = MIT_url_head + twoDaysAgo + '/US_' + abbrev + '.csv'
            df = pd.read_csv(MIT_url)

            currentPositivesLower = 0
            currentPositivesMean = 0
            currentPositivesUpper = 0
            for k in range(5,22):
                pastDate = date - dt.timedelta(days=k)
                pastDate_strf = pastDate.strftime("%Y-%m-%d")
                k_days_ago = (df["date"] == pastDate_strf)
                df_pastDate = df.loc[k_days_ago]

                currentPositivesLower += df_pastDate['predicted_new_infected_lower'].sum() * probPCRPos(k)
                currentPositivesMean += df_pastDate['predicted_new_infected_mean'].sum() * probPCRPos(k)
                currentPositivesUpper += df_pastDate['predicted_new_infected_upper'].sum() * probPCRPos(k)

            positivesLower += currentPositivesLower
            positivesMean += currentPositivesMean
            positivesUpper += currentPositivesUpper
            pop += statePops[state]
            probPositiveLower = currentPositivesLower / statePops[state]
            probPositiveMean = currentPositivesMean / statePops[state]
            probPositiveUpper = currentPositivesUpper / statePops[state]

            if (i == 0):
                result.loc[0 if pd.isnull(result.index.max()) else result.index.max() + 1] = [state, probPositiveLower, probPositiveMean, probPositiveUpper]
            else:
                resultSept.loc[0 if pd.isnull(resultSept.index.max()) else resultSept.index.max() + 1] = [probPositiveLower, probPositiveMean, probPositiveUpper]

        if (i == 0):
            intlProbLower = positivesLower/pop
            intlProbMean = positivesMean/pop
            intlProbUpper = positivesUpper/pop
            result.loc[result.index.max() + 1] = ['International', intlProbLower, intlProbMean, intlProbUpper]
        else:
            intlProbLower = positivesLower/pop
            intlProbMean = positivesMean/pop
            intlProbUpper = positivesUpper/pop
            resultSept.loc[resultSept.index.max() + 1] = [intlProbLower, intlProbMean, intlProbUpper]
    result = pd.concat([result, resultSept], axis=1)
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
    start_date = "2020-10-01"
    in_US = df["location_name"].isin(states)
    after_start_date = df["date"] >= start_date
    in_US_and_recent = in_US & after_start_date
    df = df.loc[in_US_and_recent]

    #  Make final CSV
    result = pd.DataFrame(columns=["location_name", "lower_prob", "mean_prob", "upper_prob"])
    resultJan = pd.DataFrame(columns=["lower_prob_jan", "mean_prob_jan", "upper_prob_jan"])

    jan = dt.date(2021,1,15)
    dates = [today, jan]

    for j, date in enumerate(dates):
        positivesLower = 0
        positivesMean = 0
        positivesUpper = 0
        pop = 0
        for state in states:
            ourState = df[df['location_name'] == state]

            currentPositivesLower = 0
            currentPositivesMean = 0
            currentPositivesUpper = 0
            for k in range(5,22):
                pastDate = date - dt.timedelta(days=k)
                pastDate_strf = pastDate.strftime("%Y-%m-%d")
                k_days_ago = (ourState["date"] == pastDate_strf)
                ourState_pastDate = ourState.loc[k_days_ago]

                currentPositivesLower += ourState_pastDate['est_infections_lower'].sum() * probPCRPos(k)
                currentPositivesMean += ourState_pastDate['est_infections_mean'].sum() * probPCRPos(k)
                currentPositivesUpper += ourState_pastDate['est_infections_upper'].sum() * probPCRPos(k)

            positivesLower += currentPositivesLower
            positivesMean += currentPositivesMean
            positivesUpper += currentPositivesUpper

            pop += statePops[state]

            probPositiveLower = currentPositivesLower / statePops[state]
            probPositiveMean = currentPositivesMean / statePops[state]
            probPositiveUpper = currentPositivesUpper / statePops[state]

            if (j == 0):
                result.loc[0 if pd.isnull(result.index.max()) else result.index.max() + 1] = [state, probPositiveLower, probPositiveMean, probPositiveUpper]
            else:
                resultJan.loc[0 if pd.isnull(resultJan.index.max()) else resultJan.index.max() + 1] = [probPositiveLower, probPositiveMean, probPositiveUpper]

        if (j == 0):
            intlProbLower = positivesLower/pop
            intlProbMean = positivesMean/pop
            intlProbUpper = positivesUpper/pop
            result.loc[result.index.max() + 1] = ['International', intlProbLower, intlProbMean, intlProbUpper]
        else:
            intlProbLower = positivesLower/pop
            intlProbMean = positivesMean/pop
            intlProbUpper = positivesUpper/pop
            resultJan.loc[resultJan.index.max() + 1] = [intlProbLower, intlProbMean, intlProbUpper]

    result = pd.concat([result, resultJan], axis=1)
    result.to_csv("./public/IHME_pcts.csv", index=False)
    return

def getNYT():
    # Download the NYTimes Data
    dates = [today] # changed to just today
    NYT_url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv'
    result = pd.DataFrame(columns=["location_name", "lower_prob", "mean_prob", "upper_prob"])

    for i, date in enumerate(dates):
        positivesLower = 0
        positivesMean = 0
        positivesUpper = 0
        pop = 0
        for abbrev in abbrevs:
            state = abbrev_us_state[abbrev]
            df = pd.read_csv(NYT_url)

            currentPositivesLower = 0
            currentPositivesMean = 0
            currentPositivesUpper = 0
            for k in range(5,22):
                pastDate = date - dt.timedelta(days=k)
                pastDate_dayBefore = pastDate - dt.timedelta(days=1)
                pastDate_strf = pastDate.strftime("%Y-%m-%d")
                pastDate_dayBefore_strf = pastDate_dayBefore.strftime("%Y-%m-%d")
                k_days_ago = (df["date"] == pastDate_strf)
                km1_days_ago = (df["date"] == pastDate_dayBefore_strf)
                ourState = (df['state'] == state)
                df_pastDate = df.loc[k_days_ago & ourState]
                df_pastDate_dayBefore = df.loc[km1_days_ago & ourState]

                newCases = df_pastDate['cases'].sum() - df_pastDate_dayBefore['cases'].sum()

                currentPositivesLower += (3 * newCases * probPCRPos(k))
                currentPositivesMean += (5 * newCases * probPCRPos(k))
                currentPositivesUpper += (10 * newCases * probPCRPos(k))

            positivesLower += currentPositivesLower
            positivesMean += currentPositivesMean
            positivesUpper += currentPositivesUpper
            pop += statePops[state]
            probPositiveLower = currentPositivesLower / statePops[state]
            probPositiveMean = currentPositivesMean / statePops[state]
            probPositiveUpper = currentPositivesUpper / statePops[state]

            if (i == 0):
                result.loc[0 if pd.isnull(result.index.max()) else result.index.max() + 1] \
                    = [state, probPositiveLower, probPositiveMean, probPositiveUpper]
            else:
                print("Are we doing January?")

        if (i == 0):
            intlProbLower = positivesLower/pop
            intlProbMean = positivesMean/pop
            intlProbUpper = positivesUpper/pop
            result.loc[result.index.max() + 1] = ['International', intlProbLower, intlProbMean, intlProbUpper]

    result.to_csv("./public/NYT_pcts.csv", index=False)
    return

def sh(script, msg=0):
    os.system("zsh -c '%s'" % script)

if __name__=="__main__":
    try:
        getIHME()
        sh('echo "got IHME data"')
    except:
        sh('echo "error getting IHME data"')
    # try:
    #     getMIT()
    #     sh('echo "got MIT data"')
    # except:
    #     sh('echo "error getting MIT data"')
    try:
        getNYT()
        sh('echo "got NYT data"')
    except:
        sh('echo "error getting NYT data"')
