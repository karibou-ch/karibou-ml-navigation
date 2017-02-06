![](https://developers.google.com/open-source/gsoc/resources/downloads/GSoC-logo-horizontal-800.png)

## Introduction

This page explain __karibou.ch learning machine__ project idea for [Google Summer of Code 2017](https://developers.google.com/open-source/gsoc/). GSoC is a program run every year by Google where students are paid to work on open source projects during their summer break. If you are a student and interested in taking part then please read the [Advice for Students](#advice-for-students) section below. Everybody (not just students) is free to edit this page and add project ideas.

[<img src="http://karibou.ch/img/k-brand.png" alt="karibouCore Logo" height="100%" />](http://karibou.ch/)
> Karibou.ch is an opensource community project and a online marketplace whose goal is to help a quality and healthy food to be distribued. Our plateform mainly focus on primary food distribution (eg. organic vegetables from farms, artisanal bread, artisanal cheese, meat from farms) 


## Objective
Get a better user experience based on stored activities data. We would like to build a «intelligent» system that will drastically reduce the friction to place a new order of products that will fit user needs. 

## Problem to solve
Currently a user that want to place a new order have to navigate on different categories and select manually each products. This process could be long and some products may be missed. Navigation through categories is often annoying. Moreover, when there are many products the organization of the lists is often of poor quality. 

## Task Idea

1. Creating a process that generate by learning a list of products (item) that fit user needs.
2. The machine learning will also create a weight of the categories to display first.
3. Use user input to specify if a product item is relevant or not (yes, not this time, never).
4. Based on thoses input, the machine learning will dynamically guess clusters of profiles that share the same needs.
5. Create a mobile version [based on our current sketch code](../karibou-ionic) with a single button that place an automatic order with a quick feedback button to specify if a product item is relevant or not.

  Required knowledge: machine learning, deep learning, nodejs, gulp, npm, mongodb
  Difficulty level: intermediate
  Potential mentors: tbd

## Expected results
* based on the [test/data](test/) generate with script a subset of training data,
* based on the [test/data](test/) generate with script a subset of positive prediction for __all user__
* based on the [test/data](test/) generate with script a subset of positive prediction for __one user__
* TODO

# Advice for Students

If you are a student and interested in working on karibou.ch project as part of GSoC then please read the information below, as well as the GSoC program information provided by Google, including the [student manual](https://developers.google.com/open-source/gsoc/resources/manual) and [timeline](https://developers.google.com/open-source/gsoc/timeline).

## Guidelines & requirements
Potential candidates should to take a look at [GitHub Issues](issues). It can help you get some idea how things would work during the GSoC.

#### Basic requirements

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


 
