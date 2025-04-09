import { useState, useEffect } from 'react';
import { NodeData } from '../types/node';
import { NetworkData } from '../types/network';
import { ContainerData } from '../types/container';

let url: string = 'http://localhost:3001/docker'


export function useTaskAPI() {
    const [taskData, setTaskData] = useState<ContainerData[]>([]);

    useEffect(() => {
        fetch(url + '/tasks')
        .then(response => response.json())
        .then(json => {
            const containers: ContainerData[] = [];
    
            for (const data of json) {
                const curr_container: ContainerData = {
                    id: data.ID,
                    ...(data.NodeID && { nodeId: data.NodeID }),
                    ...(data.Labels && { labels: data.Labels }), //TODO
                    image: data.Spec.ContainerSpec.Image,
                    status: data.Status.State,
                    networks: data.NetworksAttachments.map((network: any) => ({
                        id: network.Network.ID,
                        name: network.Network.Spec.Name,
                        driver: network.Network.DriverState.Name,
                        ipAddress: network.Addresses[0]
                    })),
                    createdAt: data.CreatedAt
                }
                containers.push(curr_container);
            }
    
            setTaskData(containers);
        })
        .catch(error => console.log(error));
    }, []);

    return { taskData };
}

export function useNodeAPI() {
    const [nodeData, setNodeData] = useState<NodeData[]>([]);
    const { taskData } = useTaskAPI();

    useEffect(() => {
        fetch(url + '/nodes')
        .then(response => response.json())
        .then(json => {
            const nodes: NodeData[] = [];
        
            for (const data of json) {
                const curr_node: NodeData = {
                    id: data.ID,
                    hostname: data.Description.Hostname,
                    role: data.Spec.Role,
                    status: data.Status.State,
                    containers: taskData.filter( (task: ContainerData) => task.nodeId == data.ID ), // only matching NodeIDs
                    labels: data.Spec.Labels, // TODO
                    createdAt: data.CreatedAt,
                    updatedAt: data.UpdatedAt
                }
                nodes.push(curr_node);
            }
    
            setNodeData(nodes);
        })
        .catch(error => console.log(error));
    }, [taskData]);

    return { nodeData };
}

export function useNetworkAPI() {
    const [networkData, setNetworkData] = useState<NetworkData[]>([]);

    useEffect(() => {
        fetch(url + '/networks')
        .then(response => response.json())
        .then(json => {     
            const networks: NetworkData[] = [];

            for (const data of json) {
                if (data.Scope === 'swarm') {
                    const curr_network: NetworkData = {
                        id: data.Id,
                        name: data.Name,
                        driver: data.Driver,
                        scope: data.Scope,
                        networkInfo: {
                            ...(data.IPAM.Config.subnet && { subnet: data.IPAM.Config.subnet }),
                            ...(data.IPAM.Config.gateway && { subnet: data.IPAM.Config.gateway }),
                        },
                        attachable: data.Attachable,
                        internal: data.Internal,
                        ...(data.Labels && { labels: data.Labels }),
                        createdAt: data.Created
                    }
                    networks.push(curr_network);
                }
            }

            setNetworkData(networks);
        })
        .catch(error => {
            console.log(error); 
        });
    }, []);

    return { networkData };
}