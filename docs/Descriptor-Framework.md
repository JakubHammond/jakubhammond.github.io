# Descriptor Framework
The Descriptor Framework is designed to store and organize data blocks in memory or storage. It allows structured access to matrices, arrays, or any data by providing metadata about the stored data.
Writes and reads are structured in consecutive memory banks using a metadata-first convention.

---

## Descriptor Layout
Each data block has a metadata header followed by the actual data.
### Extension Code (8 bits)
- Defines the type of the following data
- Examples: numeric, character, matrix, storage type, etc.
- Tells the system how to interpret the next addresses
### Start Address & Bank
- The memory or storage address where the data starts
- Can include a bank identifier if multiple banks are used
### End Address & Bank
- Address where the data ends (consecutive data storage model)
### Data-specific Metadata
- For matrices: rows × columns
- For strings or other structured data: name, type, size, etc.
### Actual Data
- Stored consecutively according to the start and end addresses & Banks
- Interpreted based on the extension code and metadata
