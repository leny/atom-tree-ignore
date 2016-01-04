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
    _fUpdate, _fApply, _fTreeViewHasMutate;

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

    _bHideState = atom.config.get( "tree-ignore.enabled" ) || false;

    _oMutationObserver = new MutationObserver( _fTreeViewHasMutate );

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
    let oIgnore;

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

_fTreeViewHasMutate = function() {
    _fUpdate();
};

export {
    oPackageConfig as config,
    fActivate as activate,
    fDeactivate as deactivate
};
