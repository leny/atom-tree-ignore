fs = require "fs-plus"
{File} = require 'pathwatcher'
ignore = require "ignore"
$ = require( "atom" ).$

_oAtomIgnoreFile = null
_bHideState = null

module.exports =
    config:
        enabled:
            type: "boolean"
            default: yes
        ignoreFileName:
            type: "string"
            default: ".atomignore"

    activate: ->
        atom.workspaceView.command "tree-ignore:toggle", => @toggle()

        _bHideState = atom.config.get "tree-ignore.enabled"

        _oAtomIgnoreFile = new File atom.project.resolve atom.config.get "tree-ignore.ignoreFileName"

        atom.config.observe "tree-ignore.enabled", ( bNewValue ) =>
            _bHideState = bNewValue
            @update()

        # TODO add watcher for _sAtomIgnoreFilePath, watching for its existence

        # TODO add watcher for any change in tree

        atom.packages.onDidActivateAll => @update()

    toggle: ->
        _bHideState = not _bHideState
        @update()

    update: ->
        return unless _oAtomIgnoreFile.exists()
        oIgnore = ignore().addIgnoreFile _oAtomIgnoreFile.getPath()

        atom.workspaceView.find( ".tree-view li.entry .name" ).each ->
            if sPath = ( $this = $( this ) ).data "path"
                $this.parents( "li.entry" ).first().toggleClass "tree-ignore-element", _bHideState and !oIgnore.filter( [ sPath ] ).length
