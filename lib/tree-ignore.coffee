fs = require "fs-plus"
ignore = require "ignore"
$ = require( "atom" ).$

_sAtomIgnoreFilePath = null
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
        return unless fs.existsSync ( _sAtomIgnoreFilePath = atom.project.resolve atom.config.get "tree-ignore.ignoreFileName" )

        atom.config.observe "tree-ignore.enabled", ( bNewValue ) =>
            _bHideState = bNewValue
            @update()

        # TODO add watcher for _sAtomIgnoreFilePath, updating tree view at each change made

        # TODO add watcher for any change in tree

        atom.packages.onDidActivateAll => @update()

    toggle: ->
        _bHideState = not _bHideState
        @update()

    update: ->
        oIgnore = ignore().addIgnoreFile _sAtomIgnoreFilePath

        atom.workspaceView.find( ".tree-view li.entry .name" ).each ->
            if sPath = ( $this = $( this ) ).data "path"
                $this.parents( "li.entry" ).first().toggleClass "tree-ignore-element", _bHideState and !oIgnore.filter( [ sPath ] ).length
