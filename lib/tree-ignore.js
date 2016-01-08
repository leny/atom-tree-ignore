"use babel";

import ignore from "ignore";
import { CompositeDisposable } from "atom";
import $ from "jquery";

let oPackageConfig,
    oDisposables, oAtomIgnoreFileDisposables,
    _bIsWindowsPlatform = document.body.classList.contains( "platform-win32" ),
    _bEnabled,
    _oAtomIgnoreFiles,
    _oMutationObserver,
    fActivate, fDeactivate,
    _fUpdate, _fApply, _fTreeViewHasMutated, _fProjectChangedPaths,
    _fAddAtomIgnoreFiles, _fNormalizePath, _fHandleIgnoreFile;

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
        "tree-ignore:toggle": _fApply.bind( null, !_bEnabled ),
        "tree-ignore:enable": _fApply.bind( null, true ),
        "tree-ignore:disable": _fApply.bind( null, false )
    } ) );

    oDisposables.add( atom.commands.add( ".platform-win32, .platform-linux, .platform-darwin", {
        "tree-view:toggle": _fUpdate.bind( null )
    } ) );

    _bEnabled = atom.config.get( "tree-ignore.enabled" ) || false;

    _oMutationObserver = new MutationObserver( _fTreeViewHasMutated );

    atom.packages.onDidActivateInitialPackages( () => {
        oDisposables.add( atom.project.onDidChangePaths( _fProjectChangedPaths ) );

        _fProjectChangedPaths();

        atom.config.observe( "tree-ignore.enabled", ( bNewValue ) => {
            if ( bNewValue !== _bEnabled ) {
                _fApply( bNewValue );
            }
        } );

        _fUpdate();
    } );
};

fDeactivate = function() {
    oDisposables && oDisposables.dispose();
    oAtomIgnoreFileDisposables && oAtomIgnoreFileDisposables.dispose();
    _oMutationObserver.disconnect();
};

_fApply = function( bValue ) {
    atom.config.set( "tree-ignore.enabled", _bEnabled = bValue );
    _fUpdate();
};

_fUpdate = function() {
    let oIgnore,
        sProjectRoot = "",
        bHandleProject;

    if ( _bEnabled && document.querySelector( ".tree-view" ) ) {
        _oMutationObserver.observe( document.querySelector( ".tree-view" ), {
            "childList": true,
            "subtree": true
        } );
    } else {
        _oMutationObserver.disconnect();
    }

    $( atom.views.getView( atom.workspace ) )
        .find( ".tree-view li.entry .name" ).each( function() {
            let sPath,
                $this,
                aFiltered = [];

            if ( sPath = ( $this = $( this ) ).data( "path" ) ) {
                let $parent = $this.parents( "li.entry" ).first();

                sPath = _fNormalizePath( sPath );
                if ( $parent.hasClass( "directory" ) ) {
                    sPath += "/";
                }
                if ( $parent.hasClass( "project-root" ) ) {
                    sProjectRoot = sPath;
                    oIgnore = _fHandleIgnoreFile( sProjectRoot );
                    bHandleProject = oIgnore !== null;
                }
                if ( oIgnore !== null ) {
                    sPath = sPath.substring( sProjectRoot.length );
                    aFiltered = oIgnore.filter( [ sPath ] );
                }
                $parent.toggleClass( "tree-ignore-element", _bEnabled && bHandleProject && !aFiltered.length );
            }
        } );
};

_fTreeViewHasMutated = function() {
    _fUpdate();
};

_fProjectChangedPaths = function() {
    _fAddAtomIgnoreFiles();
    _fUpdate();
};

_fAddAtomIgnoreFiles = function() {
    let sIgnoreFileName = atom.config.get( "tree-ignore.ignoreFileName" );

    oAtomIgnoreFileDisposables && oAtomIgnoreFileDisposables.dispose();
    oAtomIgnoreFileDisposables = new CompositeDisposable();
    _oAtomIgnoreFiles = {};

    atom.project.getDirectories().forEach( ( oDirectory ) => {
        let oIgnoreFile = oDirectory.getFile( sIgnoreFileName );

        _oAtomIgnoreFiles[ _fNormalizePath( `${ oDirectory.getPath() }/` ) ] = oIgnoreFile;
        oAtomIgnoreFileDisposables.add( oIgnoreFile.onDidChange( _fUpdate ) );
    } );
};

_fNormalizePath = function( sPath ) {
    if ( _bIsWindowsPlatform ) {
        return sPath.replace( /\\/g, "/" );
    }
    return sPath;
};

_fHandleIgnoreFile = function( sPath ) {
    let sIgnoreFile = _oAtomIgnoreFiles[ sPath ];

    if ( sIgnoreFile == null ) {
        // New root / project path, look if it has an ignore file
        return null; // Don't handle this project
    }
    if ( !sIgnoreFile.existsSync() ) {
        return null; // Removed, unhide everything
    }

    return ignore().addIgnoreFile( sIgnoreFile.getPath() );
};

export {
    oPackageConfig as config,
    fActivate as activate,
    fDeactivate as deactivate
};
