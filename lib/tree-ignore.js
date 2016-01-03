"use babel";

import ignore from "ignore";
import { CompositeDisposable, File } from "atom";
import $ from "jquery";

let oPackageConfig,
    oDisposables,
    _bIsWindowsPlatform = document.body.classList.contains( "platform-win32" ),
    _bHideState,
    _oAtomIgnoreFile,
    fActivate, fDeactivate,
    _fToggle, _fUpdate;

oPackageConfig = {
    "enabled": {
        "type": "boolean",
        "default": true
    },
    "ignoreFileName": {
        "type": "string",
        "default": ".atomignore"
    }
};

fActivate = function() {
    oDisposables && oDisposables.dispose();
    oDisposables = new CompositeDisposable();

    oDisposables.add( atom.commands.add( "atom-workspace", {
        "tree-ignore:toggle": _fToggle,
        "tree-ignore:update": _fUpdate
    } ) );

    _bHideState = atom.config.get( "tree-ignore.enabled" ) || false;

    ( _oAtomIgnoreFile = new File( atom.project.resolvePath( atom.config.get( "tree-ignore.ignoreFileName" ) ) ) )
        .onDidChange( _fUpdate );

    atom.config.observe( "tree-ignore.enabled", ( bNewValue ) => {
        _bHideState = bNewValue;
        _fUpdate();
    } );

    atom.packages.onDidActivateInitialPackages( _fUpdate );
};

fDeactivate = function() {
    oDisposables && oDisposables.dispose();
};

_fToggle = function() {
    _bHideState = !_bHideState;
    _fUpdate();
};

_fUpdate = function() {
    let oIgnore;

    if ( !_oAtomIgnoreFile.existsSync() ) {
        $( atom.views.getView( atom.workspace ) )
            .find( ".tree-view li.entry" )
                .removeClass( "tree-ignore-element" );
        return;
    }

    oIgnore = ignore().addIgnoreFile( _oAtomIgnoreFile.getPath() );

    $( atom.views.getView( atom.workspace ) )
        .find( ".tree-view li.entry .name" ).each( function() {
            let sPath, $this;

            if ( sPath = ( $this = $( this ) ).data( "path" ) ) {
                if ( _bIsWindowsPlatform ) {
                    sPath = sPath.replace( /\\/g, "/" );
                }
                $this.parents( "li.entry" ).first().toggleClass( "tree-ignore-element", _bHideState && !oIgnore.filter( [ sPath ] ).length );
            }
        } );
};

export {
    oPackageConfig as config,
    fActivate as activate,
    fDeactivate as deactivate
};
