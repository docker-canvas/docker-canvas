import { error } from 'console';
import { useState, useEffect } from 'react';


export function useDockerAPI(path: 'nodes' | 'networks' | 'tasks' | 'services' | 'init') {
    const [taskData, setTaskData] = useState<object[]>([]);
    const [nodeData, setNodeData] = useState<object[]>([]);
    const [networkData, setNetworkData] = useState<object[]>([]);
    const [serviceData, setServiceData] = useState<object[]>([]);

    let base: string = 'http://localhost:3001/docker'
    let url: string;

    function getNodes(url: string) {
        fetch(url)
        .then(response => response.json())
        .then(json => setNodeData(json))
        .catch(error => console.log(error));
    }

    function getNetworks(url: string) {
        fetch(url)
        .then(response => response.json())
        .then(json => setNetworkData(json))
        .catch(error => console.log(error));
    }

    function getTasks(url: string) {
        fetch(url)
        .then(response => response.json())
        .then(json => setTaskData(json))
        .catch(error => console.log(error));
    }

    function getServices(url: string) {
        fetch(url)
        .then(response => response.json())
        .then(json => setServiceData(json))
        .catch(error => console.log(error));
    }
    

    useEffect(() => {
        switch(path) {
            case 'nodes':
                url = base + '/nodes';
                getNodes(url);
                break;
            case 'networks':
                url = base + '/networks';
                getNetworks(url);
                break;
            case 'tasks':
                url = base + '/tasks';
                getTasks(url);
                break;
            case 'services':
                url = base + '/services';
                getServices(url);
                break;
            default: // fetch all 4 endpoints to initialize
                url = base + '/nodes';
                getNodes(url);

                url = base + '/networks';
                getNetworks(url);

                url = base + '/tasks';
                getTasks(url);

                url = base + '/services';
                getServices(url);
                break;
        }
    }, [path]);

    return { taskData, nodeData, networkData, serviceData };
}