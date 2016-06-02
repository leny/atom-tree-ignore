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

You can also control the state of hiding by using `tree-ignore:toggle`, `tree-ignore:enable` & `tree-ignore:disable` commands.

## Keybindings

With the success of Atom, it's really difficult to choose keybindings that will not enter in conflict with anyone else's packages, so I have removed the default keystrokes and let the keymap empty to let you set your own keybindings.
