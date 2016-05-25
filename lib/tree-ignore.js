"use babel";

import ignore from "ignore";
import { CompositeDisposable } from "atom";
import $ from "jquery";

let oPackageConfig,
    fActivate, fDeactivate,
    _oDisposables, _oAtomIgnoreFileDisposables,
    _oMutationObserver,
    _bIsWindowsPlatform = document.body.classList.contains( "platform-win32" ),
    _oAtomIgnoreFiles,
    _fUpdate, _fApply, _fTreeViewHasMutated, _fProjectChangedPaths, _fGetCurrentState,
    _fAddAtomIgnoreFiles, _fNormalizePath, _fHandleIgnoreFile, _fUnhideParents;

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
    _oDisposables && _oDisposables.dispose();
    _oDisposables = new CompositeDisposable();

    _oDisposables.add( atom.commands.add( "atom-workspace", {
        "tree-ignore:toggle": () => {
            _fApply( !atom.config.get( "tree-ignore.enabled" ) );
        },
        "tree-ignore:enable": _fApply.bind( null, true ),
        "tree-ignore:disable": _fApply.bind( null, false )
    } ) );

    _oDisposables.add( atom.commands.add( ".platform-win32, .platform-linux, .platform-darwin", {
        "tree-view:toggle": _fUpdate.bind( null )
    } ) );

    _oMutationObserver = new MutationObserver( _fTreeViewHasMutated );

    atom.packages.onDidActivateInitialPackages( () => {
        _oDisposables.add( atom.project.onDidChangePaths( _fProjectChangedPaths ) );

        _fProjectChangedPaths();

        atom.config.observe( "tree-ignore.enabled", ( bNewValue ) => {
            if ( bNewValue !== atom.config.get( "tree-ignore.enabled" ) ) {
                _fApply( bNewValue );
            }
        } );

        _fUpdate();
    } );
};

fDeactivate = function() {
    _oDisposables && _oDisposables.dispose();
    _oAtomIgnoreFileDisposables && _oAtomIgnoreFileDisposables.dispose();
    _oMutationObserver.disconnect();
};

_fGetCurrentState = function() {
    return atom.config.get( "tree-ignore.enabled" );
};

_fApply = function( bValue ) {
    atom.config.set( "tree-ignore.enabled", bValue );
    _fUpdate();
};

_fUpdate = function() {
    let oIgnore,
        oIgnoredItems = {},
        sProjectRoot = "",
        bHandleProject,
        bState = _fGetCurrentState();

    if ( bState && document.querySelector( ".tree-view" ) ) {
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
                bFiltered = false;

            if ( sPath = ( $this = $( this ) ).data( "path" ) ) {
                let $parent = $this.parents( "li.entry" ).first();

                sPath = _fNormalizePath( sPath );
                if ( $parent.hasClass( "directory" ) ) {
                    sPath += "/";
                }
                if ( $parent.hasClass( "project-root" ) ) {
                    sProjectRoot = sPath;
                    oIgnore = _fHandleIgnoreFile( sProjectRoot );
                    bHandleProject = oIgnore != null;
                }
                if ( oIgnore != null ) {
                    sPath = sPath.substring( sProjectRoot.length );
                    bFiltered = oIgnore.filter( [ sPath ] ).length === 0;
                    if ( bFiltered ) {
                        if ( sPath.endsWith( "/" ) ) {
                            oIgnoredItems[ sPath ] = $parent;
                        }
                    } else {
                        _fUnhideParents( oIgnoredItems, sPath );
                    }
                }
                $parent.toggleClass( "tree-ignore-element", bState && bHandleProject && bFiltered );
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

    _oAtomIgnoreFileDisposables && _oAtomIgnoreFileDisposables.dispose();
    _oAtomIgnoreFileDisposables = new CompositeDisposable();
    _oAtomIgnoreFiles = {};

    atom.project.getDirectories().forEach( ( oDirectory ) => {
        let oIgnoreFile = oDirectory.getFile( sIgnoreFileName );

        _oAtomIgnoreFiles[ _fNormalizePath( `${ oDirectory.getPath() }/` ) ] = oIgnoreFile;
        _oAtomIgnoreFileDisposables.add( oIgnoreFile.onDidChange( _fUpdate ) );
    } );
};

_fNormalizePath = function( sPath ) {
    if ( _bIsWindowsPlatform ) {
        return sPath.replace( /\\/g, "/" );
    }
    return sPath;
};

_fHandleIgnoreFile = function( sPath ) {
    let sIgnoreFile = _oAtomIgnoreFiles && _oAtomIgnoreFiles[ sPath ] ?
        _oAtomIgnoreFiles[ sPath ] : null;

    if ( sIgnoreFile == null ) {
        // New root / project path, look if it has an ignore file
        return null; // Don't handle this project
    }
    if ( !sIgnoreFile.existsSync() ) {
        return null; // Removed, unhide everything
    }

    return ignore().addIgnoreFile( sIgnoreFile.getPath() );
};

_fUnhideParents = function( oIgnoredItems, sPath ) {
    const getParent = function( sChildPath ) {
        if ( sChildPath.endsWith( "/" ) ) {
            return sChildPath.replace( /[^\/]*\/$/, "" );
        }
        return sChildPath.replace( /\/.*?$/, "/" );
    };
    let sParent = sPath, oItem;

    while ( sParent.includes( "/" ) ) {
        sParent = getParent( sParent );
        oItem = oIgnoredItems[ sParent ];
        if ( oItem != null ) {
            oItem.removeClass( "tree-ignore-element" );
        }
    }
};

export {
    oPackageConfig as config,
    fActivate as activate,
    fDeactivate as deactivate
};
