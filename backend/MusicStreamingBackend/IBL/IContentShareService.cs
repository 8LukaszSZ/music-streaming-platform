using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IContentShareService
    {
        Task<List<ContentShare>> GetSharesSentByUserAsync(Guid userId);
        Task<List<ContentShare>> GetSharesReceivedByUserAsync(Guid userId);

        Task<ContentShare> ShareContentAsync(
            Guid sharerId,
            Guid sharedToUserId,
            Guid contentId,
            string contentType,
            string? message
        );

        Task<ContentShare?> DeleteShareAsync(Guid contentShareId);
    }
}
