using Models.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IBL
{
    public interface IContentPlayService
    {
        Task AddPlayAsync(
            Guid contentId,
            string contentType,
            Guid? userId
        );

        Task<long> GetPlaysCountAsync(Guid contentId, string contentType);

        Task<long> GetPlaysCountAsync(
            Guid contentId,
            string contentType,
            DateTime fromDate
        );

        Task<List<ContentPlay>> GetUserPlaysAsync(Guid userId,DateTime fromDate);
    }
}