Full stats window should show the sum of all items consumed/produced that are not specifically satisfied by existing edges.
Cases that must be considered:
- *Floating* ports: Ports with no edges should be simply added to the stats.
- *Overflowing* ports: edges that have a higher input than output
- *Underflowing* ports: edges that have a higher output than input.
- NxM connections:
  These are complicated.
  First we resolve all the 1x1 connections, until none are left.
  getUnresolvedConnections(graph, )->Edge[], getSoleConnections(Edge[])->Edge[],
  Dump all edges into list, get info of each port they are tied to, make into edgeData like


## Data Structures

Edge:
- Input: Port that has negative item/s, pulling items out of the edge
- Output: Port that has positive item/s, pushing items into the edge

Port:
- Rate (Item/s)

portId - portId Array

record of portId -> [itemRate, connectionCount]

We can assume items on the inputs/outputs of the edges are the same,
as it should be impossible to have improper connections 

## Algorithm
Create a Record of [itemRate, connectionCount] from each port.
Create array of [outputId, inputId] from each edge. \
While array count > 1:
- Check for solo output edges. 
- Check for solo input edges. 


### processEdge()
([outputId, inputId], <portID, [itemRate, connectionCount]>) -> <portID, [itemRate, connectionCount]>

This should take the passed edge info, get the numbers from both from the record, which will be something like:

input: -3 \
output: +5 \
Then we add them together and follow these rules:
- If the result is positive, then set the input to 0 and the output to the result.
- If the result is 0, then set both to zero.
- if the result is negative, the set the input to the result adn the output to zero.

Next, subtract 1 from the connectionCounts of both.
