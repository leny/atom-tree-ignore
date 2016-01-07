"use babel";

import ignore from "ignore";
import { CompositeDisposable, File } from "atom";
import $ from "jquery";

let oPackageConfig,
    oDisposables,
    _bIsWindowsPlatform = document.body.classList.contains( "platform-win32" ),
    _bHideState,
    _oAtomIgnoreFile,
    _oMutationObserver,
    fActivate, fDeactivate,
    _fUpdate, _fApply, _fTreeViewHasMutated;

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
        "tree-ignore:toggle": _fApply.bind( null, !_bHideState ),
        "tree-ignore:enable": _fApply.bind( null, true ),
        "tree-ignore:disable": _fApply.bind( null, false )
    } ) );

    oDisposables.add( atom.commands.add( ".platform-win32, .platform-linux, .platform-darwin", {
        "tree-view:toggle": _fUpdate.bind( null )
    } ) );

    _bHideState = atom.config.get( "tree-ignore.enabled" ) || false;

    _oMutationObserver = new MutationObserver( _fTreeViewHasMutated );

    atom.packages.onDidActivateInitialPackages( () => {
        ( _oAtomIgnoreFile = new File( atom.project.resolvePath( atom.config.get( "tree-ignore.ignoreFileName" ) ) ) )
            .onDidChange( _fUpdate );

        atom.config.observe( "tree-ignore.enabled", ( bNewValue ) => {
            if ( bNewValue !== _bHideState ) {
                _fApply( bNewValue );
            }
        } );

        _fUpdate();
    } );
};

fDeactivate = function() {
    oDisposables && oDisposables.dispose();
    _oMutationObserver.disconnect();
};

_fApply = function( bValue ) {
    atom.config.set( "tree-ignore.enabled", _bHideState = bValue );
    _fUpdate();
};

_fUpdate = function() {
    let oIgnore, sProjectRoot;

    if ( _bHideState && document.querySelector( ".tree-view" ) ) {
        _oMutationObserver.observe( document.querySelector( ".tree-view" ), {
            "childList": true,
            "subtree": true
        } );
    } else {
        _oMutationObserver.disconnect();
    }

    if ( !_oAtomIgnoreFile.existsSync() ) {
        $( atom.views.getView( atom.workspace ) )
            .find( ".tree-view li.entry" )
                .removeClass( "tree-ignore-element" );
        return;
    }

    oIgnore = ignore().addIgnoreFile( _oAtomIgnoreFile.getPath() );

    sProjectRoot = "";
    aTreeEntries = [];
    $( atom.views.getView( atom.workspace ) )
        .find( ".tree-view li.entry .name" ).each( function() {
            let sPath, $this, aFiltered;

            if ( sPath = ( $this = $( this ) ).data( "path" ) ) {
                let $parent = $this.parents( "li.entry" ).first();

                if ( _bIsWindowsPlatform ) {
                    sPath = sPath.replace( /\\/g, "/" );
                }
                if ( $parent.hasClass( "directory" ) ) {
                    sPath += "/";
                }
                if ( $parent.hasClass( "project-root" ) ) {
                    sProjectRoot = sPath;
                }
                sPath = sPath.substring( sProjectRoot.length );
                aFiltered = oIgnore.filter( [ sPath ] );
                $parent.toggleClass( "tree-ignore-element", _bHideState && !aFiltered.length );
            }
        } );
};

_fTreeViewHasMutated = function() {
    _fUpdate();
};

export {
    oPackageConfig as config,
    fActivate as activate,
    fDeactivate as deactivate
};
