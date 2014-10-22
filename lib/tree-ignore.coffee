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
        atom.workspaceView.command "tree-ignore:update", => @update()

        _bHideState = atom.config.get "tree-ignore.enabled"

        _oAtomIgnoreFile = new File atom.project.resolve atom.config.get "tree-ignore.ignoreFileName"

        _oAtomIgnoreFile.onDidChange => @update()
        # TODO onDidRename ?
        # TODO onDidDelete ?

        # atom.project.getDirectories().forEach ( oDirectory ) =>
        #     oDirectory.onDidChange =>
        #         # TODO should wait that the tree is updated (how ?)
        #         @update()

        atom.config.observe "tree-ignore.enabled", ( bNewValue ) =>
            _bHideState = bNewValue
            @update()

        atom.packages.onDidActivateAll => @update()

    toggle: ->
        _bHideState = not _bHideState
        @update()

    update: ->
        return atom.workspaceView.find( ".tree-view li.entry" ).removeClass "tree-ignore-element" unless _oAtomIgnoreFile.exists()
        oIgnore = ignore().addIgnoreFile _oAtomIgnoreFile.getPath()

        atom.workspaceView.find( ".tree-view li.entry .name" ).each ->
            if sPath = ( $this = $( this ) ).data "path"
                $this.parents( "li.entry" ).first().toggleClass "tree-ignore-element", _bHideState and !oIgnore.filter( [ sPath ] ).length
