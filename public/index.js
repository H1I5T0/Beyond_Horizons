document.addEventListener('DOMContentLoaded', function() {
  const helpfulContainers = document.querySelectorAll('.helpful-content');
  
  helpfulContainers.forEach(container => {
      const paragraphs = container.querySelectorAll('p');
      let lastClickedParagraph = null;
    
      paragraphs.forEach(p => {
          p.addEventListener('click', function(event) {
              if (lastClickedParagraph === this) {
                  this.style.color = '';
                  lastClickedParagraph = null;
                  return;
              }
              if (lastClickedParagraph) {
                  lastClickedParagraph.style.color = '';
              }
              this.style.color = '#EB662B';
              lastClickedParagraph = this;
          });
      });
  });
});

    document.querySelectorAll('.components-column').forEach(column => {
      let lastClickedColumn = null;
      
      column.addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
          toggleActiveElement(event.target, lastClickedColumn, (element) => {
            lastClickedColumn = element;
          });
        }
      });
    });
    
    function toggleActiveElement(currentElement, lastClickedElement, setLastClicked) {
      if (currentElement === lastClickedElement) {
        currentElement.classList.remove('active-text');
        setLastClicked(null);
      } else {
        if (lastClickedElement) {
          lastClickedElement.classList.remove('active-text');
        }
        currentElement.classList.add('active-text');
        setLastClicked(currentElement);
      }
    }