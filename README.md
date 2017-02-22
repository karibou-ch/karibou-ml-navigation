![](https://developers.google.com/open-source/gsoc/resources/downloads/GSoC-logo-horizontal-800.png)

## Introduction

This page explains __karibou.ch machine learning__ project idea for [Google Summer of Code 2017](https://developers.google.com/open-source/gsoc/). GSoC is a program run every year by Google where students are paid to work on open source projects during their summer break. If you are a student and interested in taking part then please read the [Advice for Students](#advice-for-students) section below. Everybody (not just students) is free to edit this page and add project ideas.

[<img src="http://karibou.ch/img/k-brand.png" alt="karibouCore Logo" height="100%" />](http://karibou.ch/)
> Karibou.ch is an opensource community project and a online marketplace whose goal is to help a quality and healthy food to be distribued. Our plateform mainly focuses on primary food distribution (eg. organic vegetables from farms, artisanal bread, artisanal cheese, meat from farms). 


## Objective
Build a better user experience based on data activities stored in the database. We would like to build an «intelligent» system that will drastically help to reduce the friction for the user to place a new order that fit his needs.

## Problem to solve
> The main challenges that startups in this segment have met include the cost of acquiring and retaining customers and drivers, competition from big delivery incumbents like AmazonFresh, unscalable logistic solutions across locations, and raising enough funding to build the business over several years.

Currently a user that wants to place a new order has to navigate on different categories and select manually each product. This process can be long and some available products may not be seen. Navigation through categories is often annoying. Moreover, when there are many products the organization of the lists is often of poor quality. 

## Task Idea
We have the hypothesis that machine learning (ML) can help to resolve this problem. This project will investigate on how to use machine learning in the scope of a food marketplace with our set of data. How the ML model can boost the user experience and help the foodmarket to acquire and retain customers.
* Is it possible to predict a list of products that will fit the customer needs for a week of food?
* What are the minimal set of input that models needs to get an accurate prediction ([toread](https://medium.com/rants-on-machine-learning/what-to-do-with-small-data-d253254d1a89#.nnpm07rer))?
* What do we need to make this prediction more accurate?
* What is the most appropriate model that fit our data?
* Based on the prediction is it possible to create clusters of customers?

``` javascript
Required knowledge: machine learning, deep learning, computer science, nodejs, npm, mongodb
Difficulty level: intermediate
Potential mentors: tbd
```

## Expected results
* From an initial set of possible models and hypothesis, what is the most appropriate model to fit our data
* Based on our data, generate a subset of training data, postive prediction and negative prediction
* Implement a learning process that could be embeded in the karibou.ch project. For example, the user places an order and the machine will learn what is relevant or not based on the prediction for the user.
* Create a simple prototype that displays a recommended product list for a user. 
* Based on the training data, it would be awesome to get clusters of customers (based on the distance between each)

## About the data
Orders contains all information about anonymized user, items, issue , time, etc. Here a short description:
``` javascript
{
    "oid": 2000002,
    "shipping": {
      "postalCode": "1205",
      "when": "2014-12-12T15:00:00.000Z",
      "bags": 2  /** Number of shipped bags for this order */
    },
    "customer": {
      "id": 2180215629900685,
      "pseudo": "f**i",
      "created": "2014-12-09T23:28:45.138Z"
    },
    "vendors": [{"slug": "les-fromages-de-gaetan"},...],
    "items": [
      {
        "title": "Mini chevrot",
        "sku": 1000020,
        "vendor": "les-fromages-de-gaetan",
        "image": "//uploadcare.com/uuid",
        "price": 4.9,
        "qty": 1,
        "category": "Produits laitiers"
        "issue": "issue_missing_product",
        "status": "failure"
      },
      ...
``` 
* `items.status` is one of `"failure", "fulfilled"`
* `items.issue` is one of `"issue_missing_client_id", "issue_missing_product", "issue_missing_validation", "issue_missing_customer_support", "issue_wrong_packing", "issue_wrong_product", "issue_wrong_client_id", "issue_wrong_product_quality", "issue_late_delivry"`


# Advice for Students

If you are a student and interested in working on karibou.ch project as part of GSoC then please read the information below, as well as the GSoC program information provided by Google, including the [student manual](https://developers.google.com/open-source/gsoc/resources/manual) and [timeline](https://developers.google.com/open-source/gsoc/timeline). 

* If you found that this is a great project, please contact us, we are active on [gitter](https://gitter.im/karibou-ch/). Just drop by and leave us a message!
* If you have your own project idea, that's great, submit your idea as a [GitHub Issues](https://github.com/karibou-ch/karibou-ml-userx/issues).

## Guidelines & requirements
Potential candidates should take a look at [GitHub Issues](https://github.com/karibou-ch/karibou-ml-userx/issues). It can help them get some idea how things would work during the GSoC.

#### Basic requirements

- Be passionate about technology (we love nodejs)
- Interested in food as a major paradigm to improve health, protect our environment and all the species with whom we share this planet
- Participate in regular meetings with the mentor
- Deliver code according to the sprints that have been defined
- Get in contact with the mentors or admins if any even remotely potential problems arise.

Experience and familiarity with most/all of these:

- nodejs, npm, mongodb,
- mocha for unit testing,
- Git, GitHub and submit pull request process,
- [Deeplearning](https://classroom.udacity.com/courses/ud730/lessons/6370362152/concepts/63703142310923) or Machine learning skills,
- Bash

#### Helpful extras

General understanding of any of these:

- TravisCI & continuous integration
- NPM packaging systems


 
