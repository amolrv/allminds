App.ImportParser = {};

App.ImportParser.tagsSupported = ["font", "edge", "hook", "node"];
App.ImportParser.errorMessage = "";
App.ImportParser.warningFlag = false;

var isValidTag = function(nodeName) {
    return App.ImportParser.tagsSupported.indexOf(nodeName) != -1;
};

var hasProcessableNodes = function(nodes) {
    var childNodeNames = [];
    for(var index=0; index < nodes.length; index++) {
        childNodeNames.push(nodes[index].nodeName);
    }
    return childNodeNames.every(isValidTag);
};

App.ImportParser.areTagsSupported = function(xmlNodes) {
    var nodeNames = jQuery.map(xmlNodes, function(node) { return node.nodeName });
    return nodeNames.every(isValidTag);
};

App.ImportParser.populateMindMapFromXML = function(xmlNodes, parentJSONNode, mindmapService){
    var previousSibling = null;
    var retValue = App.ImportParser.areTagsSupported(xmlNodes);
    if(retValue == false) {
        return false;
    }


    for(var i = 0; i < xmlNodes.length ;i++) {
        if(xmlNodes[i].nodeName == "node") {
            var nodeName = xmlNodes[i].getAttribute("TEXT") ? xmlNodes[i].getAttribute("TEXT") : "";
            var direction = xmlNodes[i].getAttribute("POSITION") ? xmlNodes[i].getAttribute("POSITION") : parentJSONNode["position"];
            var newNode = App.ImportParser.createNode(parentJSONNode, nodeName, direction, previousSibling);
            newNode._id = mindmapService.addNode(newNode);

            if (previousSibling && previousSibling._id) {
                mindmapService.updateNode(previousSibling._id, {next: newNode._id});
            }

            previousSibling = newNode;
            var childNodes = xmlNodes[i].childNodes;
            if(hasProcessableNodes(childNodes)) {
                if(App.ImportParser.populateMindMapFromXML(childNodes, newNode, mindmapService) == false) {
                    return false;
                }
            }
        }
    }
    return true;
};

App.ImportParser.createNode = function (parent, newNodeName, dir, previousSibling) {
    return {
        name: newNodeName, position: dir,
        parent_ids: [].concat(parent.parent_ids || []).concat([parent._id]),
        previous: (previousSibling ? previousSibling._id : null), next: null
    };
};

App.ImportParser.createRootNode = function(rootId, rootName) {
    return {
        name: rootName, position: null,
        children: [], _id: rootId
    };
};

App.ImportParser.prepareXMLDoc = function(xmlString) {
    var xmlText = xmlString.replace(new RegExp('[\n]', 'g'), '');
    xmlText = xmlText.replace(new RegExp('[\t]', 'g'), '');
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlText, "text/xml");

    return xmlDoc;
};

var ignoreComments = function(nodes) {
    return $(nodes).filter(function(index, element) { return element.nodeName != "#comment"});
};

App.ImportParser.createMindmapFromXML = function(xmlString, mindmapService) {
    App.ImportParser.errorMessage = "";
    App.ImportParser.warningFlag = false;
    var xmlDoc = App.ImportParser.prepareXMLDoc(xmlString);
    var documentNode = xmlDoc.documentElement;
    var level0Nodes = ignoreComments(documentNode.childNodes);

    if(level0Nodes.length > 0 && level0Nodes[0].nodeName == "parsererror") {
        App.ImportParser.errorMessage = "Invalid XML format";
        return null;
    } else if(documentNode.nodeName != "map") {
        App.ImportParser.errorMessage = "Not a mindmap: Invalid mindmap file";
        return null;
    } else if( level0Nodes.length <= 0) {
        App.ImportParser.errorMessage = "Not a mindmap: Root node not found";
        return null;
    }else if( level0Nodes.length > 1) {
        App.ImportParser.errorMessage = "Not a mindmap: Multiple root nodes found";
        return null;
    }

    var level0Node = level0Nodes[0];
    if( level0Node.nodeName != "node") {
        App.ImportParser.errorMessage = "Not a mindmap: Non 'node' element found";
        return null;
    }

    var rootChildNodes = level0Node.childNodes;

    for (var i = 0; i < rootChildNodes.length ;i++) {
        if(rootChildNodes[i].nodeName == "node" && !rootChildNodes[i].getAttribute("POSITION")) {
            App.ImportParser.errorMessage = "Not a mindmap: POSITION attribute not found in child node of root node";
            return null;
        }
    }

    var rootNodeText = (level0Node.getAttribute("TEXT") === undefined) ? "" : level0Node.getAttribute("TEXT");
    var mindMapId = "";

    if(mindmapService) {
        mindMapId = mindmapService.createRootNode(rootNodeText);

        var rootNodeJSON = App.ImportParser.createRootNode(mindMapId, rootNodeText);
        if(App.ImportParser.populateMindMapFromXML(rootChildNodes, rootNodeJSON, mindmapService) == false) {
            App.ImportParser.errorMessage = "Errors in mindMap file, mindMap rendered might not be as expected";
            App.ImportParser.warningFlag = true;
        }
    } else {
        App.ImportParser.errorMessage = "Internal Error";
        return null;
    }

    return mindMapId;
};
