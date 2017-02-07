![](https://developers.google.com/open-source/gsoc/resources/downloads/GSoC-logo-horizontal-800.png)

## Introduction

This page explain __karibou.ch learning machine__ project idea for [Google Summer of Code 2017](https://developers.google.com/open-source/gsoc/). GSoC is a program run every year by Google where students are paid to work on open source projects during their summer break. If you are a student and interested in taking part then please read the [Advice for Students](#advice-for-students) section below. Everybody (not just students) is free to edit this page and add project ideas.

[<img src="http://karibou.ch/img/k-brand.png" alt="karibouCore Logo" height="100%" />](http://karibou.ch/)
> Karibou.ch is an opensource community project and a online marketplace whose goal is to help a quality and healthy food to be distribued. Our plateform mainly focus on primary food distribution (eg. organic vegetables from farms, artisanal bread, artisanal cheese, meat from farms) 


## Objective
Get a better user experience based on data activities stored in the db. We would like to build a «intelligent» system that will drastically help to reduce the friction for the user to place a new order that fit his needs. 

## Problem to solve
> The main challenges that startups in this segment have met include the cost of acquiring and retaining customers and drivers, competition from big delivery incumbents like AmazonFresh, unscalable logistic solutions across locations, and raising enough funding to build the business over several years.

Currently a user that want to place a new order have to navigate on different categories and select manually each products. This process could be long and some products may be missed. Navigation through categories is often annoying. Moreover, when there are many products the organization of the lists is often of poor quality. 

## Task Idea
We have the hypothese that learning machine can help to resolve this problem. This project will investigate on how to use a learning machine in the scope of a food marketplace with our small set of data. How the learning machine can boost the user experience and help the foodmarket to acquire and retain customers.
* Is it possible to predict a list of products that will fit the customer needs for a week of food?
* What are the minimal set of input that models needs to get an accurate prediction?
* What do we need to make this prediction more accurate?
* What is the most appropriate model that fit our data?
* Based on the prediction is it possible to create clusters of customers?

``` javascript
Required knowledge: machine learning, deep learning, computer science, nodejs, npm, mongodb
Difficulty level: intermediate
Potential mentors: tbd
```

## Expected results
* From an initial set of possible models and hypotheses, which is the most appropriate model to fit our data
* Based on our data, generate a subset of training data, postive prediction and negative prediction
* Implement a learing process that could be embeded in the karibou.ch project. For exemple, user place an order and the machine will learn what is relvant or not based on the prediction for the user.
* Create a a simple prototype that display a prediction product list for a user. 
* Based on training data, it will be awesome to get clusters of customers (based on the distance between each)

# Advice for Students

If you are a student and interested in working on karibou.ch project as part of GSoC then please read the information below, as well as the GSoC program information provided by Google, including the [student manual](https://developers.google.com/open-source/gsoc/resources/manual) and [timeline](https://developers.google.com/open-source/gsoc/timeline). 

* I found a great project! How can I contact my mentor?
 * How to contact us. we are active on [gitter](https://gitter.im/karibou-ch/). Just drop by and leave us a message!
* I have an own project idea! 
 * Superb! We recommend you submit your idea as a [GitHub Issues](https://github.com/karibou-ch/karibou-ml-userx/issues).

## Guidelines & requirements
Potential candidates should to take a look at [GitHub Issues](https://github.com/karibou-ch/karibou-ml-userx/issues). It can help you get some idea how things would work during the GSoC.

#### Basic requirements

- Be pationate, reactive and technically brilliant :-)
- Participate in regular meetings with your mentor.
- Deliver code before the deadline
- Get in contact with your mentors or the admins if any even remotely potential problems arise.

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


 
