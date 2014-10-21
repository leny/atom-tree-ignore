_bHidingState = yes # hiding by default

module.exports =

    activate: ->
        atom.workspaceView.command "tree-ignore:toggle", => @toggle()
        console.log "Hey, I'm here, and I should look for an .atomignore file."
        
    toggle: ->
        console.log "Toggle state of the hiding"
