fs = require "fs-plus"
{File} = require 'pathwatcher'
ignore = require "ignore"
$ = require "jquery"

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
        atom.commands.add "atom-workspace",
            "tree-ignore:toggle": => @toggle()
            "tree-ignore:update": => @update()

        _bHideState = atom.config.get "tree-ignore.enabled"

        _oAtomIgnoreFile = new File atom.project.getDirectories()[0]?.resolve atom.config.get "tree-ignore.ignoreFileName"

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

        atom.packages.onDidActivateInitialPackages => @update()

    toggle: ->
        _bHideState = not _bHideState
        @update()

    update: ->
        return $( atom.views.getView( atom.workspace ) ).find( ".tree-view li.entry" ).removeClass "tree-ignore-element" unless _oAtomIgnoreFile.exists()
        oIgnore = ignore().addIgnoreFile _oAtomIgnoreFile.getPath()

        $( atom.views.getView( atom.workspace ) ).find( ".tree-view li.entry .name" ).each ->
            if sPath = ( $this = $( this ) ).data "path"
                $this.parents( "li.entry" ).first().toggleClass "tree-ignore-element", _bHideState and !oIgnore.filter( [ sPath ] ).length
