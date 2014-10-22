# Atom tree-ignore package

> Use a .atomignore file to hide files & folder in tree view

* * *

## Feature

Sometimes, you want to hide some files & folders from the tree view. With Atom, you can make it globally, or for each project, *via* the `gitignore` file.  
But... if you don't want to hide file globally, or ignore them in your repo ?

Use an `.atomignore` file in your projects !

It works like a regular `.gitignore` file, but only hide the files & folders in the Atom's tree view.

## Usage

Simply add an `.atomignore` file in your project.

You can also toggle the hiding temporary by using `shift-cmd-h` keys.

## Todos

* [ ] Update the tree-view at each file/folder change
* [ ] Update the tree-view when `.atomignore` is created/deleted
* [ ] Add ability to add a file/folder to `.atomignore` from the tree-view
